import { getAuth } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const auth = getAuth();
    const user = auth.currentUser;

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    } as any;

    if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API Request Failed');
    }

    return response.json();
}
