"use client"

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from '../../../context/AuthContext';

export default function DoctorProfile() {
    const { user, loading } = useAuth();
    const [doctor, setDoctor] = useState<any>(null);
    const router = useRouter();
    const params = useParams<{ doctor: string }>();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    const fetchDoctor = async () => {
        try {
            const response = await fetch(`/api/admin/${params.doctor}/doctor`);
            if (response.ok) {
                const data = await response.json();
                setDoctor(data);
            }
        } catch (err) {
            console.error("Failed to fetch doctor", err);
        }
    }

    useEffect(() => {
        if (user?.roles.includes('admin')) {
            fetchDoctor();
        }
    }, [user]);

    const revokeDoctor = async () => {
        if (!confirm("Are you sure you want to revoke this doctor?")) return;
        await fetch(`/api/admin/${params.doctor}/revoke-doctor`, {
            method: "POST"
        })
        router.push('/admin/doctors')
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

    return (
        <div>
            {doctor && (
                <div>
                    <div>
                        <h1>Doctor Profile</h1>
                        <p>Name: {doctor.name}</p>
                        <p>Email: {doctor.email}</p>
                        <p>Specialization: {doctor.specialization}</p>
                        <p>Graduated From: {doctor.graduated_from}</p>
                        <p>Place of Practice: {doctor.place_of_practice}</p>
                        <p>Type of Registration: {doctor.type_of_registration}</p>
                        <p>Years of Experience: {doctor.years_of_experience}</p>
                        <p>Phone Number: {doctor.phone_number}</p>
                        <p>Identification Number: {doctor.identification_number}</p>
                        <p>Reviewed By: {doctor.reviewed_by} at: {doctor.reviewed_at}</p>
                        <p>Doctor URL: {doctor.doctor_license_url}</p>
                    </div>
                    <button onClick={revokeDoctor} className="bg-red-500 text-white px-4 py-2 rounded">Revoke Doctor</button>
                </div>
            )}

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}