import { Plus, Wifi, MapPin, Calendar } from 'lucide-react';

export function DeviceRegistry() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Device Registry & IoT Management</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            ITIL Service Asset & Configuration Management (SACM)
          </p>
        </div>
        <button className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Register New Device</span>
        </button>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center">
            <Wifi className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-[24px] font-bold mb-3">Device Registry Management</h2>
          <p className="text-gray-600 text-[15px] mb-6">
            Comprehensive device registration, provisioning, and lifecycle management for all MyDudu IoT devices.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-gray-50 rounded-lg">
              <MapPin className="w-5 h-5 text-[#11998E] mb-2" />
              <h3 className="font-semibold text-[15px] mb-1">Geo-Location Tracking</h3>
              <p className="text-[13px] text-gray-600">Track device deployment locations</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-[#11998E] mb-2" />
              <h3 className="font-semibold text-[15px] mb-1">Lifecycle Management</h3>
              <p className="text-[13px] text-gray-600">Monitor device age and maintenance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
