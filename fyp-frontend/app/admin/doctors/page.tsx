"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"

export default function DoctorsList() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(2);
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [loading, user, router])

    const fetchDoctors = async () => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        const response = await fetch(`/api/admin/doctors?${params.toString()}`);
        const data = await response.json()
        setDoctors(Array.isArray(data) ? data : []);
    }

    useEffect(() => {
        if (user && user.roles.includes("admin")) {
            fetchDoctors();
        }
    }, [user, page, limit])


    const handleNextPagination = () => {
        setPage(page + 1);
    }

    const handlePreviousPagination = () => {
        setPage(page - 1);
    }

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        fetchDoctors();
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
                <form onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        placeholder="Search for Doctor Name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
                </form>
            </div>
            <div>
                <h1>Doctors List</h1>
                <ul>
                    {doctors.map((doctor: any) => (
                        <li key={doctor.user_id}>
                            <p onClick={() => router.push(`/admin/doctors/${doctor.user_id}`)}>Name: {doctor.name}</p>
                            <p>Email: {doctor.email}</p>
                            <p>Reviewed By: {doctor.reviewed_by} at: {doctor.reviewed_at}</p>
                        </li>
                    ))}
                </ul>

                {page > 1 &&
                    <button onClick={handlePreviousPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Previous Page</button>
                }
                {doctors.length === limit &&
                    <button onClick={handleNextPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Next Page</button>
                }
            </div>

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}