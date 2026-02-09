"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AppUser extends User {
  id?: number;
  fullName?: string;
  role?: string;
  assignedLocation?: {
    kecamatan?: string;
    village?: string;
    posyanduName?: string;
    puskesmasName?: string;
  };
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        try {
          const token = await currentUser.getIdToken(true);
          const res = await fetch(`${API_URL}/users/details?email=${currentUser.email}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
            .catch(() => {
              return null;
            });

          if (res && res.ok) {
            const dbUser = await res.json();
            // Merge DB data into the User object
            const appUser = currentUser as AppUser;
            appUser.id = dbUser.id;
            appUser.fullName = dbUser.fullName;
            appUser.role = dbUser.role ? dbUser.role.toLowerCase() : undefined;
            appUser.assignedLocation = dbUser.assignedLocation;
            setUser(appUser);
          } else {
            // If details fail but we have user, try sync once
            await fetch(`${API_URL}/auth/sync`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            setUser(currentUser);
          }
        } catch {
          // If network error, maybe keep them logged in? 
          // But if it's a 401 from the earlier calls (which throw?), we should logout.
          // Since the fetch calls inside try block might not throw on 4xx unless we check res.ok, 
          // let's rely on the explicit signInWithGoogle check for the initial login.
          // However, for persistent sessions, if validation fails, we should logout.
          setUser(null);
          // We don't force signOut here to avoid loops if API is just down, 
          // but strictly, if the user is invalid, they shouldn't be here.
        }
      } else {
        setUser(currentUser);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken(true);

      // Explicitly sync/validate with backend
      const res = await fetch(`${API_URL}/auth/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        // If backend rejects, sign out from Firebase immediately
        await signOut(auth);
        throw new Error(errorData.message || "Login ditolak oleh server.");
      }

      // If success, the useEffect listener will pick up the state change and set the user
    } catch (error: any) {
      // Ensure we are signed out if validation failed
      if (auth.currentUser) {
        await signOut(auth);
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
