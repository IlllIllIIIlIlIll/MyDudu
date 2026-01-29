import { UserPlus, Edit, Trash2, Shield, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ImageCropper } from '@/components/ImageCropper';
import { getCroppedImg } from '@/utils/getCroppedImg';
import { Area } from 'react-easy-crop';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';

interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'puskesmas' | 'posyandu';
  assignedLocation: string;
  status: 'Active' | 'Suspended' | 'Pending';
  createdAt: string;
  lastLogin: string;
  phoneNumber?: string; // Replaced passwordHash
  profilePicture?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function UserManagement() {
  console.log("Current API URL:", API_URL);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [districtSearch, setDistrictSearch] = useState('');
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const [posyanduName, setPosyanduName] = useState('');
  const [villages, setVillages] = useState<{ id: number; name: string; district: { name: string } }[]>([]);
  const [villageSearch, setVillageSearch] = useState('');
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState('');

  // Debounced Village Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (villageSearch.length >= 2 && currentUser?.role === 'puskesmas') {
        try {
          const token = await auth.currentUser?.getIdToken();
          const res = await fetch(`${API_URL}/users/villages?q=${villageSearch}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setVillages(await res.json());
          }
        } catch (e) {
          console.error("Failed to search villages", e);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [villageSearch, currentUser?.role]);

  const filteredDistricts = districts.filter(d =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase())
  );


  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formattedUsers = data.map((u: any) => {
          const role = u.role.toLowerCase();
          return {
            id: u.id,
            username: u.email.split('@')[0],
            email: u.email,
            fullName: u.fullName,
            role: role,
            status: u.status === 'ACTIVE' ? 'Active' : u.status === 'PENDING' ? 'Pending' : 'Suspended',
            assignedLocation: role === 'admin' ? 'Indonesia' : role === 'puskesmas' ? (u.district?.name || 'Unknown District') : (u.posyandu?.village?.name || 'Unknown Village'),
            createdAt: new Date(u.createdAt).toLocaleDateString(),
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-',
            phoneNumber: u.phoneNumber,
            profilePicture: u.profilePicture
          };
        });
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_URL}/districts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDistricts(data);
      }
    } catch (error) {
      console.error("Failed to fetch districts", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDistricts();
  }, []);

  // Image Cropper State
  const [profilePicBase64, setProfilePicBase64] = useState<string | undefined>(undefined);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSaveCroppedImage = async (croppedAreaPixels: Area, rotation: number) => {
    if (tempImageSrc && croppedAreaPixels) {
      try {
        const croppedImageBlob = await getCroppedImg(tempImageSrc, croppedAreaPixels, rotation);
        if (croppedImageBlob) {
          const reader = new FileReader();
          reader.readAsDataURL(croppedImageBlob);
          reader.onloadend = () => {
            setProfilePicBase64(reader.result as string);
            setShowCropper(false);
            setTempImageSrc(null);
          };
        }
      } catch (e) {
        console.error("Failed to crop image", e);
        alert("Failed to process image");
      }
    }
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    // Tab logic: if roleFilter is 'pending', show only Pending.
    // If roleFilter is 'all' or specific role, show Active/Suspended matching that role.
    if (roleFilter === 'pending') {
      return matchesSearch && user.status === 'Pending';
    } else {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole && user.status !== 'Pending';
    }
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'puskesmas':
        return 'bg-blue-100 text-blue-700';
      case 'posyandu':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'IT Admin';
      case 'puskesmas':
        return 'Puskesmas';
      case 'posyandu':
        return 'Posyandu';
      default:
        return role;
    }
  };

  const handleCreateUser = () => {
    alert('Form pembuatan user baru akan dibuka');
  };

  const handleEditUser = (user: UserAccount) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setEmail(user.email);
    // Note: In real app, we might need to fetch full details or store district name in UserAccount to pre-fill districtSearch
    // For now assuming we can use assignedLocation if it's not 'Unknown'
    setDistrictSearch(user.role === 'puskesmas' ? user.assignedLocation : '');
    setShowRegisterModal(true);
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (confirm(`Hapus user ${user.fullName}? Aksi ini tidak dapat dibatalkan.`)) {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/users/${user.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setUsers(users.filter(u => u.id !== user.id));
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error occurring while deleting user');
      }
    }
  };

  const handleApproveUser = async (user: UserAccount) => {
    if (confirm(`Approve registration for ${user.fullName}?`)) {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/users/${user.id}/approve`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchUsers();
          alert(`User ${user.fullName} approved.`);
        } else {
          alert('Failed to approve user');
        }
      } catch (error) {
        console.error('Error approving user:', error);
      }
    }
  };

  const handleRejectUser = async (user: UserAccount) => {
    if (confirm(`Reject registration for ${user.fullName}? This will suspend the account.`)) {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_URL}/users/${user.id}/reject`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchUsers();
          alert(`User ${user.fullName} rejected.`);
        } else {
          alert('Failed to reject user');
        }
      } catch (error) {
        console.error('Error rejecting user:', error);
      }
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Cropper Modal Overlay */}
      {showCropper && tempImageSrc && (
        <ImageCropper
          imageSrc={tempImageSrc}
          onCancel={() => { setShowCropper(false); setTempImageSrc(null); }}
          onConfirm={handleSaveCroppedImage}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            ITIL Service Operation - Access Management & User Administration
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setEditingUserId(null);
            setFullName('');
            setEmail('');
            setDistrictSearch('');
            setVillageSearch('');
            setPosyanduName('');
            setProfilePicBase64(undefined);
            setShowRegisterModal(true);
          }}
          className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-semibold">
            {currentUser?.role === 'puskesmas' ? 'Register Posyandu' : 'Register Puskesmas'}
          </span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Total Users</p>
          <p className="text-[28px] font-bold text-[#11998E]">{users.length}</p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-sm border border-purple-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">IT Admins</p>
          <p className="text-[28px] font-bold text-purple-600">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Puskesmas Operators</p>
          <p className="text-[28px] font-bold text-blue-600">
            {users.filter(u => u.role === 'puskesmas').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Posyandu Operators</p>
          <p className="text-[28px] font-bold text-green-600">
            {users.filter(u => u.role === 'posyandu').length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        {['active', 'pending'].map((tab) => (
          <button
            key={tab}
            onClick={() => setRoleFilter(tab === 'pending' ? 'pending' : 'all')} // Simplified tab logic for demo
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${(tab === 'pending' && roleFilter === 'pending') || (tab === 'active' && roleFilter !== 'pending')
              ? 'border-[#11998E] text-[#11998E]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab === 'active' ? 'Active Users' : 'Pending Approvals'}
          </button>
        ))}
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                />
              </div>
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                disabled={roleFilter === 'pending'} // Disable role filter in pending tab
              >
                <option value="all">All Roles</option>
                <option value="admin">IT Admin</option>
                <option value="puskesmas">Puskesmas</option>
                <option value="posyandu">Posyandu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Role</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Assigned Location</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Phone Number</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Created At</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Last Login</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.fullName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                          {user.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-[15px]">{user.fullName}</p>
                        <p className="text-[13px] text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{user.assignedLocation}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${user.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : user.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[14px] text-gray-600 font-medium">
                      {user.phoneNumber || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{user.createdAt}</td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{user.lastLogin}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleApproveUser(user)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectUser(user)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        currentUser?.role === 'admin' && (
                          <>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                              disabled={user.role === 'admin'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <p className="text-[15px] text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* Simplified Modal for Registration (Demo) */}
      {/* In real app, make this a separate component */}
      {/* Simplified Modal for Registration (Demo) */}
      {/* Replaced <dialog> with standard fixed div to avoid layout/stacking issues */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl md:rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold">
                {isEditing ? 'Edit User' : (currentUser?.role === 'puskesmas' ? 'Register Posyandu Operator' : 'Register Puskesmas Operator')}
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only"></span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={async (e) => {
              e.preventDefault();

              if (!fullName || !email) {
                alert("Please fill all required fields");
                return;
              }

              const payload = {
                fullName,
                email, // usually email isn't editable easily without re-verification, allowing specific fields 
                district: districtSearch,
                village: villageSearch,
                posyanduName: posyanduName,
                profilePicture: profilePicBase64
              };

              try {
                let url = `${API_URL}/users/puskesmas`;
                let method = 'POST';

                if (isEditing && editingUserId) {
                  url = `${API_URL}/users/${editingUserId}`;
                  method = 'PATCH';
                } else if (currentUser?.role === 'puskesmas') {
                  url = `${API_URL}/users/posyandu`;
                }

                const token = await auth.currentUser?.getIdToken();
                const res = await fetch(url, {
                  method: method,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(payload),
                });

                if (res.ok) {
                  alert(isEditing ? "User updated successfully!" : "Puskesmas operator registered successfully!");
                  setShowRegisterModal(false);

                  // Reset form
                  setIsEditing(false);
                  setEditingUserId(null);
                  setFullName('');
                  setEmail('');
                  setDistrictSearch('');
                  setVillageSearch('');
                  setPosyanduName('');
                  setProfilePicBase64(undefined);

                  // Refresh list
                  fetchUsers();
                } else {
                  const errData = await res.json();
                  alert(`Operation failed: ${errData.message || 'Unknown error'}`);
                }
              } catch (error) {
                console.error("Operation error:", error);
                alert("An error occurred.");
              }
            }}>
              {/* Profile Picture Input Section in Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (Upload & Crop)</label>
                <div className="flex items-center gap-4">
                  {profilePicBase64 && (
                    <img src={profilePicBase64} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[#11998E]" />
                  )}
                  <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <span className="text-[18px]">📷</span>
                    <span>{profilePicBase64 ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Image will be cropped to 1:1 and optimized.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g. Dr. Budi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded-lg p-2"
                  placeholder="budi@puskesmas.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* District Autocomplete Field - Only for Admin */}
              {(currentUser?.role === 'admin' || !currentUser) && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan/District</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2"
                    placeholder="Type to search kecamatan..."
                    value={districtSearch}
                    onChange={(e) => {
                      setDistrictSearch(e.target.value);
                      setShowDistrictDropdown(true);
                      setSelectedDistrict(''); // Reset selection when typing
                    }}
                    onFocus={() => setShowDistrictDropdown(true)}
                    required
                  />

                  {/* Autocomplete Dropdown */}
                  {showDistrictDropdown && districtSearch && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                      {filteredDistricts.length > 0 ? (
                        filteredDistricts.map((district) => (
                          <button
                            key={district.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {
                              setDistrictSearch(district.name);
                              setSelectedDistrict(district.name);
                              setShowDistrictDropdown(false);
                            }}
                          >
                            {district.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 italic">
                          Kecamatan tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Village & Posyandu Fields for Puskesmas */}
              {currentUser?.role === 'puskesmas' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posyandu Name</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="e.g. Mawar Melati"
                      value={posyanduName}
                      onChange={(e) => setPosyanduName(e.target.value)}
                      required={!isEditing}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelurahan/Desa</label>
                    <input
                      type="text"
                      className="w-full border rounded-lg p-2"
                      placeholder="Type to search village..."
                      value={villageSearch}
                      onChange={(e) => {
                        setVillageSearch(e.target.value);
                        setShowVillageDropdown(true);
                      }}
                      onFocus={() => setShowVillageDropdown(true)}
                      required={!isEditing}
                    />
                    {showVillageDropdown && villageSearch.length >= 2 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto mt-1">
                        {villages.length > 0 ? (
                          villages.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                              onClick={() => {
                                setVillageSearch(v.name);
                                setSelectedVillage(v.name);
                                setShowVillageDropdown(false);
                              }}
                            >
                              {v.name} ({v.district.name})
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500 italic">No villages found</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-[#11998E] text-white rounded-lg hover:opacity-90">
                  {isEditing ? 'Save Changes' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
