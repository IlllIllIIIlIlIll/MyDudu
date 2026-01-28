"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
      console.log("Auth State Changed:", currentUser);

      if (currentUser && currentUser.email) {
        try {
          const res = await fetch(`http://localhost:3000/users/details?email=${currentUser.email}`)
            .catch(err => {
              console.warn("AuthContext: Failed to fetch user details (API might be down)", err);
              return null;
            });

          if (res && res.ok) {
            const dbUser = await res.json();
            // Merge DB data into the User object
            const appUser = currentUser as AppUser;
            appUser.id = dbUser.id;
            appUser.fullName = dbUser.fullName;
            appUser.role = dbUser.role;
            appUser.assignedLocation = dbUser.assignedLocation;
            setUser(appUser);
          } else {
            setUser(currentUser);
          }
        } catch (error) {
          console.error("Failed to fetch user details:", error);
          setUser(currentUser);
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
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
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
