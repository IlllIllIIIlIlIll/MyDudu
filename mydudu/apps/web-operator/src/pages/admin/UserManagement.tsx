import { UserPlus, Edit, Trash2, Shield, Search, Filter } from 'lucide-react';
import { useState } from 'react';

interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'puskesmas' | 'posyandu';
  assignedLocation: string;
  status: 'Active' | 'Suspended';
  createdAt: string;
  lastLogin: string;
}

const mockUserAccounts: UserAccount[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@mydudu.id',
    fullName: 'System Administrator',
    role: 'admin',
    assignedLocation: 'All System',
    status: 'Active',
    createdAt: '2025-01-01',
    lastLogin: '2026-01-19 09:30'
  },
  {
    id: '2',
    username: 'sari.wijaya',
    email: 'sari.wijaya@mydudu.id',
    fullName: 'Sari Wijaya',
    role: 'posyandu',
    assignedLocation: 'Posyandu Melati - Desa Sukamaju',
    status: 'Active',
    createdAt: '2025-06-15',
    lastLogin: '2026-01-19 08:45'
  },
  {
    id: '3',
    username: 'ahmad.fauzi',
    email: 'ahmad.fauzi@mydudu.id',
    fullName: 'Dr. Ahmad Fauzi',
    role: 'puskesmas',
    assignedLocation: 'Puskesmas Cianjur - Kecamatan Cianjur',
    status: 'Active',
    createdAt: '2025-03-20',
    lastLogin: '2026-01-19 09:15'
  },
  {
    id: '4',
    username: 'dewi.lestari',
    email: 'dewi.lestari@mydudu.id',
    fullName: 'Dewi Lestari',
    role: 'posyandu',
    assignedLocation: 'Posyandu Mawar - Desa Makmur',
    status: 'Active',
    createdAt: '2025-07-10',
    lastLogin: '2026-01-18 16:20'
  },
  {
    id: '5',
    username: 'budi.santoso',
    email: 'budi.santoso@mydudu.id',
    fullName: 'Budi Santoso',
    role: 'posyandu',
    assignedLocation: 'Posyandu Kenanga - Desa Sejahtera',
    status: 'Suspended',
    createdAt: '2025-05-05',
    lastLogin: '2025-12-20 14:10'
  }
];

export function UserManagement() {
  const [users, setUsers] = useState(mockUserAccounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
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
    alert(`Edit user: ${user.fullName}`);
  };

  const handleDeleteUser = (user: UserAccount) => {
    if (confirm(`Hapus user ${user.fullName}? Aksi ini tidak dapat dibatalkan.`)) {
      setUsers(users.filter(u => u.id !== user.id));
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>User Management</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            ITIL Service Operation - Access Management & User Administration
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="gradient-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-semibold">Create New User</span>
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
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Last Login</th>
                <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[15px]">{user.fullName}</p>
                      <p className="text-[13px] text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{user.assignedLocation}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[13px] font-semibold ${
                      user.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[15px] text-gray-600">{user.lastLogin}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
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

      {/* Access Control Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[15px] text-blue-800 mb-1">ITIL Access Management</p>
            <p className="text-[14px] text-blue-700">
              All user accounts are bound to specific locations for data security. Posyandu operators can only access their assigned posyandu. 
              Puskesmas operators can view all posyandus within their kecamatan. Only IT admins have full system access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
