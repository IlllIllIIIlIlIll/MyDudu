import { FileText, Download, Search, Filter, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: string;
  user: string;
  action: string;
  details: string;
  ipAddress: string;
}

const mockLogs: LogEntry[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-01-19 09:45:23',
    level: 'info',
    category: 'Authentication',
    user: 'sari.wijaya@mydudu.id',
    action: 'User Login',
    details: 'Successful login from Posyandu operator',
    ipAddress: '192.168.1.105'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-01-19 09:42:15',
    level: 'success',
    category: 'Data Sync',
    user: 'system',
    action: 'Device Synchronization',
    details: 'Alat Dudu 3 synchronized 42 measurement records',
    ipAddress: '10.0.0.23'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-01-19 09:38:47',
    level: 'warning',
    category: 'Device',
    user: 'system',
    action: 'Low Battery Alert',
    details: 'Alat Dudu 5 battery level at 15%',
    ipAddress: '10.0.0.25'
  },
  {
    id: 'LOG-004',
    timestamp: '2026-01-19 09:35:12',
    level: 'error',
    category: 'API',
    user: 'ahmad.fauzi@mydudu.id',
    action: 'Failed API Request',
    details: 'GET /api/reports timeout after 30s',
    ipAddress: '192.168.1.87'
  },
  {
    id: 'LOG-005',
    timestamp: '2026-01-19 09:30:05',
    level: 'info',
    category: 'User Management',
    user: 'admin@mydudu.id',
    action: 'User Created',
    details: 'New Posyandu operator account created: dewi.sari@mydudu.id',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'LOG-006',
    timestamp: '2026-01-19 09:25:33',
    level: 'success',
    category: 'Validation',
    user: 'ahmad.fauzi@mydudu.id',
    action: 'Medical Validation',
    details: 'Approved validation for session S20260119001',
    ipAddress: '192.168.1.87'
  },
  {
    id: 'LOG-007',
    timestamp: '2026-01-19 09:20:18',
    level: 'error',
    category: 'Database',
    user: 'system',
    action: 'Query Error',
    details: 'Connection pool exhausted, 3 retry attempts failed',
    ipAddress: '10.0.0.100'
  },
  {
    id: 'LOG-008',
    timestamp: '2026-01-19 09:15:45',
    level: 'info',
    category: 'Report',
    user: 'ahmad.fauzi@mydudu.id',
    action: 'Report Generated',
    details: 'Monthly report for Kecamatan Cianjur generated',
    ipAddress: '192.168.1.87'
  }
];

export function SystemLogs() {
  const [logs] = useState(mockLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(logs.map(l => l.category)))];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-orange-100 text-orange-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'info':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleExportLogs = () => {
    alert('System logs akan diekspor ke format CSV');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>System Logs</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            ITIL Service Operation - Event & Audit Trail Management
          </p>
        </div>
        <button
          onClick={handleExportLogs}
          className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Download className="w-5 h-5" />
          <span className="font-semibold">Export Logs</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Info Events</p>
          <p className="text-[28px] font-bold text-blue-600">
            {logs.filter(l => l.level === 'info').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Success Events</p>
          <p className="text-[28px] font-bold text-green-600">
            {logs.filter(l => l.level === 'success').length}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Warnings</p>
          <p className="text-[28px] font-bold text-orange-600">
            {logs.filter(l => l.level === 'warning').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg shadow-sm border border-red-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Errors</p>
          <p className="text-[28px] font-bold text-red-600">
            {logs.filter(l => l.level === 'error').length}
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs by action, user, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
                />
              </div>
            </div>
            <div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#11998E] text-[15px]"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Timestamp</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Level</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Category</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">User</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Action</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-mono text-gray-700">{log.timestamp}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      <span className={`px-2 py-1 rounded text-[12px] font-semibold ${getLevelBadge(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[14px] text-gray-700 font-medium">{log.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] text-gray-600">{log.user}</p>
                    <p className="text-[12px] text-gray-400">{log.ipAddress}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-semibold text-gray-700">{log.action}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] text-gray-600">{log.details}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <p className="text-[15px] text-gray-600">
            Showing {filteredLogs.length} of {logs.length} log entries
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[15px] text-blue-800 mb-1">ITIL Event Management</p>
            <p className="text-[14px] text-blue-700">
              System logs are retained for 90 days for compliance and audit purposes. All user actions, API calls, and system events are tracked. 
              Critical errors automatically trigger incident management workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
