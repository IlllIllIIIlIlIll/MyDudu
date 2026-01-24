"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface ExtendedUser extends User {
    role?: 'puskesmas' | 'posyandu' | 'admin';
    assignedLocation?: {
        posyanduName?: string;
        village?: string;
        puskesmasName?: string;
        kecamatan?: string;
    };
}

interface AuthContextType {
    user: ExtendedUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // TODO: Fetch real role/location from backend using the token
                // For now, inject default for UI testing
                (currentUser as ExtendedUser).role = 'puskesmas';
                (currentUser as ExtendedUser).assignedLocation = {
                    puskesmasName: 'Puskesmas Sukapura',
                    kecamatan: 'Dayeuhkolot'
                };
            }
            setUser(currentUser as ExtendedUser);
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
