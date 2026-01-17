"use client"

import { useEffect, useState } from "react"
import { useAuth } from '../../context/AuthContext'
import { useRouter } from "next/navigation"

export default function UserList() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(2);
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router])

    const fetchUsers = async () => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (search) params.append('search', search);
        const response = await fetch(`/api/users?${params.toString()}`);
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
    }

    useEffect(() => {
        if (user?.roles.includes('admin')) {
            fetchUsers();
        }
    }, [user, search, page, limit])

    const handleNextPagination = () => {
        setPage(page + 1);
    }

    const handlePreviousPagination = () => {
        setPage(page - 1);
    }

    const handleOnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers();
    }

    if (loading) return <p>Loading...</p>

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
            <div>
                <form onSubmit={handleOnSubmit}>
                    <input
                        type="text"
                        placeholder="Search for user name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>
            </div>

            <div>
                {users && users.map((user) => {
                    const created_at = new Date(user.created_at);
                    const now = new Date();

                    const diffInMs = now.getTime() - created_at.getTime();
                    const accountAge = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                    return (
                        <div key={user.id}>
                            <h1 onClick={() => router.push(`/admin/users/${user.id}`)}>Name: {user.name}</h1>
                            <p>Email: {user.email}</p>
                            <p>Age: {user.age}</p>
                            <p>Sex: {user.sex}</p>
                            <p>Emergency Contact Email: {user.emergency_contact_email}</p>
                            <p>Account Age: {accountAge}</p>
                        </div>
                    )
                })}
                {page > 1 &&
                    <button onClick={handlePreviousPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Previous Page</button>
                }
                {users.length === limit &&
                    <button onClick={handleNextPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Next Page</button>
                }
                {users.length === 0 && <p>No Users Found!</p>}
            </div>

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div >
    )
}