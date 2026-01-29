import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { Server, Users, Smartphone, Activity, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { OverviewCard } from '../../components/OverviewCard';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.warn("Dashboard API not ready (404/Error). Showing empty state.");
          setStats({});
          return;
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        setStats({});
      }
    };

    fetchData();
  }, []);

  if (!stats) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2">Loading dashboard...</span>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1>System Overview</h1>
        <p className="text-gray-600 text-[15px] mt-1">
          IT Administrator Dashboard - System Health & Performance Monitoring
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverviewCard
          title="Total Users"
          value={stats?.users?.total || 0}
          icon={Users}
          color="#38EF7D"
          subtitle={`Pending: ${stats?.users?.pending || 0}`}
        />
        <OverviewCard
          title="Registered Devices"
          value={stats?.devices?.total || 0}
          icon={Smartphone}
          color="#11998E"
          subtitle={`Active: ${stats?.devices?.active || 0}`}
        />
        <OverviewCard
          title="Total Sessions"
          value={stats?.sessions?.total || 0}
          icon={Activity}
          color="#3B82F6"
          subtitle={`Today: ${stats?.sessions?.today || 0}`}
        />
        <OverviewCard
          title="Open Incidents"
          value={stats?.incidents?.open || 0}
          icon={AlertTriangle}
          color="#FF9800"
          subtitle="Needs attention"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nutrition Risk */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#11998E]" />
            <h3 className="font-bold text-[18px]">Nutrition Risk Overview</h3>
          </div>
          <ul className="space-y-3">
            {stats?.nutrition?.map((n: any, i: number) => (
              <li key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">{n.category || 'UNKNOWN'}</span>
                <span className="font-bold text-[#11998E] text-[18px]">{n._count}</span>
              </li>
            ))}
            {!stats?.nutrition?.length && <p className="text-gray-500">No data available.</p>}
          </ul>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[18px] mb-4">Unread Notifications</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-5xl font-bold text-red-600">{stats?.notifications?.unread || 0}</p>
              <p className="text-gray-500 mt-2">System Alerts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[18px] mb-4">Recent Incidents</h3>
          <div className="space-y-3">
            {stats?.incidents?.recent?.map((inc: any) => (
              <div key={inc.id} className="flex justify-between items-center border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-[15px]">{inc.title}</p>
                  <p className="text-[13px] text-gray-500">{inc.priority}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[12px] font-semibold ${inc.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                  {inc.status}
                </span>
              </div>
            ))}
            {!stats?.incidents?.recent?.length && <p className="text-gray-500">No recent incidents.</p>}
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-[18px] mb-4">Recent System Logs</h3>
          <ul className="space-y-3">
            {stats?.logs?.map((log: any) => (
              <li key={log.id} className="text-[14px] p-3 border-b last:border-0 border-gray-100">
                <span className="font-mono text-gray-400 text-[12px] block mb-1">{new Date(log.createdAt).toLocaleString()}</span>
                <span className="font-medium text-gray-800">{log.action}</span>
              </li>
            ))}
            {!stats?.logs?.length && <p className="text-gray-500">No logs available.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
