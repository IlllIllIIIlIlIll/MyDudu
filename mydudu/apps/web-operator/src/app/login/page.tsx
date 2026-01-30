"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Login } from "@/views/Login";

export default function LoginPage() {
    const router = useRouter();
    const { user, signInWithGoogle, loading } = useAuth();

    useEffect(() => {
        if (user && !loading) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#11998E] to-[#38EF7D]">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <Login onLogin={signInWithGoogle} />
    );
}
