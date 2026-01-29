import { useState, useEffect } from 'react';
import { Plus, Wifi, MapPin, Tablet, Activity, Edit2, Search } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';

interface Device {
  id: number;
  deviceUuid: string;
  name: string;
  posyanduId: number | null;
  isActive: boolean;
  posyandu?: {
    name: string;
  };
}

interface Posyandu {
  id: number;
  name: string;
  villageId: number;
}

interface Village {
  id: number;
  name: string;
  posyandus: Posyandu[];
}

interface District {
  id: number;
  name: string;
  villages: {
    id: number;
    name: string;
    posyandus: Posyandu[];
  }[];
}

export function DeviceRegistry() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    posyanduId: '',
    isActive: true,
  });

  // Location Search State (Register)
  const [posyanduSearch, setPosyanduSearch] = useState('');
  const [showPosyanduDropdown, setShowPosyanduDropdown] = useState(false);
  const [isNewPosyandu, setIsNewPosyandu] = useState(false);

  const [villageSearch, setVillageSearch] = useState('');
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const [devicesRes, districtsRes] = await Promise.all([
        fetch('http://localhost:3000/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3000/districts', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      const devicesData = await devicesRes.json();
      const districtsData = await districtsRes.json();
      setDevices(Array.isArray(devicesData) ? devicesData : []);
      setDistricts(Array.isArray(districtsData) ? districtsData : []);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({ name: '', posyanduId: '', isActive: true });
    setPosyanduSearch('');
    setVillageSearch('');
    setIsNewPosyandu(false);
    setSelectedVillageId('');
  };

  const handleRegister = async () => {
    try {
      let finalPosyanduId = formData.posyanduId;
      const token = await auth.currentUser?.getIdToken();

      if (isNewPosyandu) {
        if (!selectedVillageId) {
          alert("Please select a village for the new Posyandu");
          return;
        }
        // Create new Posyandu
        const posyanduRes = await fetch('http://localhost:3000/districts/posyandu', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: posyanduSearch,
            villageId: parseInt(selectedVillageId)
          })
        });

        if (!posyanduRes.ok) throw new Error("Failed to create Posyandu");
        const newPosyandu = await posyanduRes.json();
        finalPosyanduId = newPosyandu.id.toString();
      }

      const res = await fetch('http://localhost:3000/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          posyanduId: finalPosyanduId ? parseInt(finalPosyanduId) : undefined,
        }),
      });

      if (res.ok) {
        setIsRegisterOpen(false);
        fetchData();
        resetForm();
      }
    } catch (error) {
      console.error('Registration failed', error);
      alert('Failed to register device');
    }
  };

  const handleUpdate = async () => {
    if (!selectedDevice) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`http://localhost:3000/devices/${selectedDevice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          posyanduId: formData.posyanduId ? parseInt(formData.posyanduId) : null,
          isActive: formData.isActive,
        }),
      });
      if (res.ok) {
        setIsEditOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Update failed', error);
    }
  };

  const openEditModal = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      posyanduId: device.posyanduId?.toString() || '',
      isActive: device.isActive,
    });
    setPosyanduSearch(device.posyandu?.name || '');
    setIsEditOpen(true);
  };

  const filteredDevices = Array.isArray(devices) ? devices.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.deviceUuid.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Flatten posyandus for search
  const allPosyandus = districts.flatMap(d => d.villages.flatMap(v => v.posyandus));
  const filteredPosyandus = allPosyandus.filter(p =>
    p.name.toLowerCase().includes(posyanduSearch.toLowerCase())
  );

  // Flatten villages for search
  const allVillages = districts.flatMap(d => d.villages);
  const filteredVillages = allVillages.filter(v =>
    v.name.toLowerCase().includes(villageSearch.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Device Registry</h1>
          <p className="text-gray-500 mt-1">Manage IoT devices, assignment, and status.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsRegisterOpen(true);
          }}
          className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Register New Device</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search devices..."
          className="max-w-md border-0 bg-transparent focus-visible:ring-0 px-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device Name</TableHead>
              <TableHead>UUID</TableHead>
              <TableHead>Location (Posyandu)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Tablet className="w-4 h-4 text-blue-600" />
                    </div>
                    {device.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{device.deviceUuid}</TableCell>
                <TableCell>
                  {device.posyandu ? (
                    <div className="flex items-center gap-2">
                      {device.posyandu.name.replace(/^Posyandu\s+/i, '')}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={device.isActive ? "default" : "secondary"} className={device.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-600 hover:bg-gray-100"}>
                    {device.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => openEditModal(device)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Device"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {filteredDevices.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No devices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Register Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold">Register New Device</h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>Device Name</Label>
                <Input
                  placeholder="e.g. Posyandu Mawar Device 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Enhanced Posyandu Search */}
              <div className="relative space-y-2">
                <Label>Assign Location (Posyandu)</Label>
                <Input
                  type="text"
                  placeholder="Type to search or add new Posyandu..."
                  value={posyanduSearch}
                  onChange={(e) => {
                    setPosyanduSearch(e.target.value);
                    setShowPosyanduDropdown(true);
                    setIsNewPosyandu(false);
                    setFormData({ ...formData, posyanduId: '' });
                  }}
                  onFocus={() => setShowPosyanduDropdown(true)}
                />

                {showPosyanduDropdown && posyanduSearch && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                    {filteredPosyandus.length > 0 ? (
                      <>
                        {filteredPosyandus.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              setPosyanduSearch(p.name);
                              setFormData({ ...formData, posyanduId: p.id.toString() });
                              setIsNewPosyandu(false);
                              setShowPosyanduDropdown(false);
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm italic text-blue-600 border-t"
                          onClick={() => {
                            setIsNewPosyandu(true);
                            setShowPosyanduDropdown(false);
                          }}
                        >
                          + Add "{posyanduSearch}" as new Posyandu
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm italic text-blue-600"
                        onClick={() => {
                          setIsNewPosyandu(true);
                          setShowPosyanduDropdown(false);
                        }}
                      >
                        + Add "{posyanduSearch}" as new Posyandu
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Village Selection for New Posyandu */}
              {isNewPosyandu && (
                <div className="relative space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
                  <Label>Select Village for "{posyanduSearch}"</Label>
                  <Input
                    type="text"
                    placeholder="Search Village..."
                    value={villageSearch}
                    onChange={(e) => {
                      setVillageSearch(e.target.value);
                      setShowVillageDropdown(true);
                    }}
                    onFocus={() => setShowVillageDropdown(true)}
                  />

                  {showVillageDropdown && villageSearch && (
                    <div className="absolute z-10 w-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                      {filteredVillages.length > 0 ? (
                        filteredVillages.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              setVillageSearch(v.name);
                              setSelectedVillageId(v.id.toString());
                              setShowVillageDropdown(false);
                            }}
                          >
                            {v.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 italic">
                          Village not found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button onClick={handleRegister} className="px-4 py-2 bg-[#11998E] text-white rounded-lg hover:opacity-90">
                Register
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Kept simplest for now */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold">Edit Device</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label>Device Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Edit Location */}
              <div className="relative space-y-2">
                <Label>Assign Location (Posyandu)</Label>
                <Input
                  type="text"
                  placeholder="Search Posyandu..."
                  value={posyanduSearch}
                  onChange={(e) => {
                    setPosyanduSearch(e.target.value);
                    setShowPosyanduDropdown(true);
                    setFormData({ ...formData, posyanduId: '' });
                  }}
                  onFocus={() => setShowPosyanduDropdown(true)}
                />

                {showPosyanduDropdown && posyanduSearch && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                    {filteredPosyandus.length > 0 ? (
                      filteredPosyandus.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                          onClick={() => {
                            setPosyanduSearch(p.name);
                            setFormData({ ...formData, posyanduId: p.id.toString() });
                            setShowPosyanduDropdown(false);
                          }}
                        >
                          {p.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 italic">
                        Posyandu not found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="active-mode" className="text-base cursor-pointer">Active Status</Label>
                  <p className="text-sm text-gray-500">Inactive devices cannot authenticate.</p>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="active-mode"
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-[#11998E] text-white rounded-lg hover:opacity-90">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
