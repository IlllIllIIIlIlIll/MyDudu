import { Server, Users, Smartphone, Activity, AlertTriangle, CheckCircle, TrendingUp, Database } from 'lucide-react';
import { OverviewCard } from '../../components/OverviewCard';

export function AdminDashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1>System Overview</h1>
        <p className="text-gray-600 text-[15px] mt-1">
          IT Administrator Dashboard - System Health & Performance Monitoring
        </p>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="System Uptime"
          value={99.8}
          icon={Server}
          color="#38EF7D"
          subtitle="Last 30 days"
        />
        <OverviewCard
          title="Active Users"
          value={145}
          icon={Users}
          color="#11998E"
          subtitle="Currently online: 42"
        />
        <OverviewCard
          title="Registered Devices"
          value={127}
          icon={Smartphone}
          color="#3B82F6"
          subtitle="Online: 98 | Offline: 29"
        />
        <OverviewCard
          title="API Calls (24h)"
          value={15420}
          icon={Activity}
          color="#FF9800"
          subtitle="Avg response: 245ms"
        />
      </div>

      {/* Service Status - ITIL Service Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-[18px] font-bold mb-6">Service Status (ITIL Service Operation)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Authentication Service', status: 'Operational', uptime: '99.9%' },
            { name: 'Database Service (PostgreSQL)', status: 'Operational', uptime: '99.8%' },
            { name: 'API Gateway', status: 'Operational', uptime: '99.7%' },
            { name: 'IoT Device Sync', status: 'Operational', uptime: '98.5%' },
            { name: 'File Storage Service', status: 'Operational', uptime: '99.5%' },
            { name: 'Notification Service', status: 'Degraded', uptime: '95.2%' }
          ].map((service, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                {service.status === 'Operational' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                )}
                <div>
                  <p className="font-semibold text-[15px]">{service.name}</p>
                  <p className="text-[13px] text-gray-500">Uptime: {service.uptime}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${
                service.status === 'Operational' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-[#11998E]" />
            <h3 className="text-[18px] font-bold">Database Performance</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] text-gray-700">Storage Usage</span>
                <span className="text-[15px] font-bold text-[#11998E]">245 GB / 500 GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-full gradient-primary rounded-full" style={{ width: '49%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] text-gray-700">Query Performance</span>
                <span className="text-[15px] font-bold text-green-600">Excellent</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[15px] text-gray-700">Connections</span>
                <span className="text-[15px] font-bold text-[#11998E]">142 / 500</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="h-full gradient-primary rounded-full" style={{ width: '28%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[#11998E]" />
            <h3 className="text-[18px] font-bold">Traffic & Usage Trends</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-[15px] text-gray-700">Daily Active Users</span>
              <div className="text-right">
                <p className="text-[20px] font-bold text-blue-600">842</p>
                <p className="text-[12px] text-green-600">↑ 12% from yesterday</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-[15px] text-gray-700">Data Synced (24h)</span>
              <div className="text-right">
                <p className="text-[20px] font-bold text-green-600">3,524</p>
                <p className="text-[12px] text-green-600">↑ 8% from yesterday</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-[15px] text-gray-700">Failed Sync Attempts</span>
              <div className="text-right">
                <p className="text-[20px] font-bold text-orange-600">23</p>
                <p className="text-[12px] text-orange-600">Requires attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Incidents - ITIL Incident Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-[18px] font-bold mb-4">Recent Incidents (ITIL Incident Management)</h3>
        <div className="space-y-3">
          {[
            { id: 'INC-2026-001', title: 'Notification service degradation', priority: 'Medium', status: 'In Progress', time: '2 hours ago' },
            { id: 'INC-2026-002', title: 'Device D005 connectivity loss', priority: 'Low', status: 'Resolved', time: '5 hours ago' },
            { id: 'INC-2026-003', title: 'Database query timeout', priority: 'High', status: 'Resolved', time: '1 day ago' }
          ].map((incident) => (
            <div key={incident.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[13px] font-mono text-gray-500">{incident.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[12px] font-semibold ${
                    incident.priority === 'High' ? 'bg-red-100 text-red-700' :
                    incident.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {incident.priority}
                  </span>
                </div>
                <p className="font-semibold text-[15px]">{incident.title}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${
                  incident.status === 'Resolved' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {incident.status}
                </span>
                <p className="text-[12px] text-gray-500 mt-1">{incident.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
