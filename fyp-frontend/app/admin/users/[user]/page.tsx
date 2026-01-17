"use client"

import { useState, useEffect } from "react"
import { useAuth } from '../../../context/AuthContext'
import { useRouter, useParams } from "next/navigation"

export default function UserProfile() {
    const [User, setUser] = useState<any>(null);
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams<{ user: string }>();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router])

    const fetchUser = async () => {
        try {
            const response = await fetch(`/api/users/${params.user}`);
            if (!response.ok) {
                router.push('/admin/users');
            }
            const data = await response.json();
            setUser(data);
        } catch (err) {
            console.log(err);
        }
    }

    const calculateAccountAge = () => {
        if (User) {
            const now = new Date();
            const created_at = new Date(User.created_at);
            const diffInMs = now.getTime() - created_at.getTime();
            const accountAge = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            return accountAge;
        }
    }

    useEffect(() => {
        if (user?.roles.includes('admin')) {
            fetchUser();
        }
    }, [user]);

    if (loading) return <div>Loading...</div>

    if (!user?.roles.includes("admin")) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-red-600">
                <h1 className="text-4xl font-bold">403 Forbidden</h1>
                <p className="text-xl">You are not authorized to view this page</p>
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white p-2 rounded">
                    Go Home
                </button>
            </div>
        )
    }

    return (
        <div>
            {User &&
                <div>
                    <h1>User Profile</h1>
                    <p>Name: {User.name}</p>
                    <p>Email: {User.email}</p>
                    <p>Age: {User.age}</p>
                    <p>Sex: {User.sex}</p>
                    <p>Emergency Contact Email: {User.emergency_contact_email}</p>
                    <p>Account Age: {calculateAccountAge()} Days</p>
                </div>
            }
            <button onClick={() => router.push('/admin/users')} className="bg-blue-500 text-white p-2 rounded">
                Back
            </button>
            <button onClick={async () => {
                const response = await fetch(`/api/users/${params.user}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    router.push('/admin/users');
                }
            }} className="bg-red-500 text-white p-2 rounded">
                Delete
            </button>

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}