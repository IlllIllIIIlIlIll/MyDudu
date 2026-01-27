import { FileText, Download, Search, AlertCircle, Info, CheckCircle, XCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

// Define the shape of a log from the API
interface SystemLog {
  id: number;
  action: string;
  details: any;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

interface Meta {
  total: number;
  page: number;
  lastPage: number;
}

export function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, lastPage: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50); // Default per user request

  const fetchLogs = async (currentPage: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/system-logs?page=${currentPage}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
        setMeta(data.meta);
      } else {
        console.error('Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const handleRefresh = () => {
    fetchLogs(page);
  };

  const getActor = (log: SystemLog) => {
    if (log.user) {
      return (
        <div>
          <p className="text-[14px] text-gray-900 font-medium">{log.user.fullName}</p>
          <p className="text-[12px] text-gray-500">{log.user.email}</p>
        </div>
      );
    }
    // Check details for device info if user is missing (System/Device event)
    if (log.details?.deviceUuid) {
      return (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            DEVICE
          </span>
          <p className="text-[13px] font-mono mt-1 text-gray-700">{log.details.deviceUuid}</p>
        </div>
      );
    }
    return <span className="text-gray-400 italic">System</span>;
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    // Remove complex objects or huge arrays if any slipped through
    const safeDetails = { ...details };
    // Simple key-value display
    return (
      <code className="text-[12px] text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200 block max-w-xs truncate">
        {JSON.stringify(safeDetails).substring(0, 100)}
        {JSON.stringify(safeDetails).length > 100 && '...'}
      </code>
    );
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
        <div className="flex gap-2">
          {/* <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button> */}
          {/* <button
            className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
            onClick={() => alert('Log export coming soon')}
          >
            <Download className="w-5 h-5" />
            <span className="font-semibold">Export Logs</span>
          </button> */}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
          <div className="text-sm text-gray-500">
            Showing latest events. Auto-refresh is manual.
          </div>
          <div className="text-sm font-medium text-gray-700">
            Total Records: {meta.total}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-[13px] font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-[13px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-left text-[13px] font-bold text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-4 text-left text-[13px] font-bold text-gray-500 uppercase tracking-wider w-1/3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-500 italic">
                    No system logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-[14px] text-gray-900 font-medium">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[12px] text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${log.action.includes('ERROR') ? 'bg-red-50 text-red-700 border-red-100' :
                          log.action.includes('WARN') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getActor(log)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDetails(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-900">{meta.page}</span> of <span className="font-medium text-gray-900">{meta.lastPage}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
              disabled={page >= meta.lastPage || loading}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
