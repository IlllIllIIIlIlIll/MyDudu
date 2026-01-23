"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user && !loading) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-900">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-zinc-800">
                <h1 className="mb-6 text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                    Operator Login
                </h1>
                <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                    Sign in to access the MyDudu Operator Portal
                </p>
                <Button
                    onClick={signInWithGoogle}
                    className="w-full"
                    variant="outline"
                >
                    Sign in with Google
                </Button>
            </div>
        </div>
    );
}
