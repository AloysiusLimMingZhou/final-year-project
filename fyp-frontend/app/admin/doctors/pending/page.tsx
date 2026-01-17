"use client"

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext"
import { useRouter } from "next/navigation"

export default function ListPendingDoctors() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(2);
    const [doctors, setDoctors] = useState<any[]>([]);

    const fetchDoctors = async () => {
        try {
            const params = new URLSearchParams();
            if (page) params.append('page', page.toString());
            if (limit) params.append('limit', limit.toString());
            if (search) params.append('search', search);
            const response = await fetch(`/api/admin/pending-doctors?${params.toString()}`);
            const data = await response.json();
            setDoctors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
        }
    }

    useEffect(() => {
        if (!loading && user && user.roles.includes("admin")) fetchDoctors();
    }, [loading, user, page, limit])

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [loading, user, router])

    const handleNextPagination = () => {
        setPage(page + 1);
    }

    const handlePreviousPagination = () => {
        setPage(page - 1);
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDoctors();
    }

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

    const approveDoctors = async (id: string) => {
        await fetch(`/api/admin/${id}/approve-doctor`, {
            method: 'POST',
        });
        fetchDoctors();
    }

    const rejectDoctors = async (id: string) => {
        await fetch(`/api/admin/${id}/reject-doctor`, {
            method: 'POST',
        });
        fetchDoctors();
    }

    return (
        <div>
            <div>
                <form onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        placeholder="Search for user name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit">Search</button>
                </form>
            </div>

            <h1>Pending Doctor List</h1>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Specialization</th>
                        <th>Graduated From</th>
                        <th>Place of Practice</th>
                        <th>Type of Registration</th>
                        <th>Years of Experience</th>
                        <th>Phone Number</th>
                        <th>Identification Number</th>
                        <th>Doctor License</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(doctors) && doctors.map((doctor) => (
                        <tr key={doctor.user_id}>
                            <td onClick={() => {
                                console.log("Navigating to review for doctor:", doctor.user_id);
                                if (doctor.user_id) {
                                    router.push(`/admin/doctor-review/${doctor.user_id}`);
                                } else {
                                    console.error("Doctor user_id is missing");
                                }
                            }} className="cursor-pointer text-blue-500 hover:underline">{doctor.name}</td>
                            <td>{doctor.email}</td>
                            <td>{doctor.specialization}</td>
                            <td>{doctor.graduated_from}</td>
                            <td>{doctor.place_of_practice}</td>
                            <td>{doctor.type_of_registration}</td>
                            <td>{doctor.years_of_experience}</td>
                            <td>{doctor.phone_number}</td>
                            <td>{doctor.identification_number}</td>
                            <td>{doctor.doctor_license_url}</td>
                            <td>
                                <button onClick={() => approveDoctors(doctor.user_id)} className="bg-green-500 text-white px-4 py-2 rounded">Approve</button>
                                <button onClick={() => rejectDoctors(doctor.user_id)} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {page > 1 &&
                <button onClick={handlePreviousPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Previous Page</button>
            }
            {doctors.length === limit &&
                <button onClick={handleNextPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Next Page</button>
            }

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}