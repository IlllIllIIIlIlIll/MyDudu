import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'puskesmas' | 'posyandu';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  fullName: string;
  assignedLocation?: {
    type: 'posyandu' | 'puskesmas' | 'kecamatan';
    posyanduName?: string;  // Specific posyandu name for posyandu operators
    village?: string;        // Village name
    kecamatan?: string;      // Kecamatan name
    puskesmasName?: string;  // Puskesmas name for puskesmas operators
  };
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration
const mockUsers: Record<string, User> = {
  'admin': {
    id: '1',
    email: 'admin@mydudu.id',
    username: 'admin',
    role: 'admin',
    fullName: 'System Administrator'
  },
  'sari.wijaya': {
    id: '2',
    email: 'sari.wijaya@mydudu.id',
    username: 'sari.wijaya',
    role: 'posyandu',
    fullName: 'Sari Wijaya',
    assignedLocation: {
      type: 'posyandu',
      posyanduName: 'Posyandu Melati',
      village: 'Desa Sukamaju',
      kecamatan: 'Kecamatan Cianjur'
    }
  },
  'ahmad.fauzi': {
    id: '3',
    email: 'ahmad.fauzi@mydudu.id',
    username: 'ahmad.fauzi',
    role: 'puskesmas',
    fullName: 'Dr. Ahmad Fauzi',
    assignedLocation: {
      type: 'puskesmas',
      puskesmasName: 'Puskesmas Cianjur',
      kecamatan: 'Kecamatan Cianjur'
    }
  },
  'rina.kusuma': {
    id: '4',
    email: 'rina.kusuma@mydudu.id',
    username: 'rina.kusuma',
    role: 'posyandu',
    fullName: 'Rina Kusuma',
    assignedLocation: {
      type: 'posyandu',
      posyanduName: 'Posyandu Mawar',
      village: 'Desa Makmur',
      kecamatan: 'Kecamatan Cianjur'
    }
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string) => {
    const username = email.split('@')[0];
    const userData = mockUsers[username];
    if (userData) {
      setUser(userData);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}