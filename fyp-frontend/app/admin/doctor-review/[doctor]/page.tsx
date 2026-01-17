"use client"

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext"
import { useRouter, useParams } from "next/navigation"


export default function DoctorReview() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams<{ doctor: string }>();
    console.log("DoctorReview page mounted with param:", params.doctor);
    const [doctor, setDoctor] = useState<any>(null);

    const fetchDoctor = async () => {
        const response = await fetch(`/api/admin/${params.doctor}/doctor-review`)
        const data = await response.json();
        setDoctor(data);
    }

    useEffect(() => {
        if (!loading && user && user.roles.includes("admin") && params.doctor) {
            fetchDoctor();
        }
    }, [loading, user, params.doctor]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [loading, user, router])

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

    if (!doctor) {
        return (
            <div>
                <h1>Loading Doctor Details</h1>
            </div>
        )
    }

    const approveDoctors = async () => {
        await fetch(`/api/admin/${params.doctor}/approve-doctor`, {
            method: 'POST',
        });
        router.push('/admin/doctors/pending');
    }

    const rejectDoctors = async () => {
        await fetch(`/api/admin/${params.doctor}/reject-doctor`, {
            method: 'POST',
        });
        router.push('/admin/doctors/pending');
    }

    return (
        <div>
            <h1>Doctor Review</h1>
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
                    <tr>
                        <td>{doctor.name}</td>
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
                            <button onClick={() => approveDoctors()} className="bg-green-500 text-white px-4 py-2 rounded">Approve</button>
                            <button onClick={() => rejectDoctors()} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}

