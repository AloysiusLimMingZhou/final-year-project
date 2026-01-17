"use client"

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Profile() {
    const { user, loading } = useAuth();
    const [profile, setProfile] = useState<any>();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [loading, user, router])

    const fetchProfile = async () => {
        const response = await fetch('/api/users/profile')
        const data = await response.json()
        setProfile(data)
    }

    useEffect(() => {
        fetchProfile();
    }, [])

    if (loading) return <p>Loading...</p>

    const calculateAccountAge = () => {
        if (profile) {
            const now = new Date();
            const created_at = new Date(profile.created_at);
            const diffInMs = now.getTime() - created_at.getTime();
            const accountAge = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
            return accountAge;
        }
    }

    return (
        <div>
            <div>
                <h1>User Profile</h1>
                <p>Name: {profile?.name}</p>
                <p>Email: {profile?.email}</p>
                <p>Latitude: {profile?.latitude}</p>
                <p>Longitude: {profile?.longitude}</p>
                <p>Age: {profile?.age}</p>
                <p>Sex: {profile?.sex}</p>
                <p>Emergency Contact Email: {profile?.emergency_contact_email}</p>
                <p>Account Age: {calculateAccountAge()}</p>
            </div>
            <button onClick={() => router.push('/profile/update')} className="bg-blue-500 text-white px-4 py-2 rounded">Update Profile</button>
            <button onClick={() => router.push('/profile/change-password')} className="bg-blue-500 text-white px-4 py-2 rounded">Change Password</button>

            {profile?.roles.includes('doctor') && (
                <div>
                    <h2>Doctor Profile</h2>
                    <p>Specialization: {profile?.specialization}</p>
                    <p>Graduated From: {profile?.graduated_from}</p>
                    <p>Place of Practice: {profile?.place_of_practice}</p>
                    <p>Years of Experience: {profile?.years_of_experience}</p>
                    <p>Type of Registration: {profile?.type_of_registration}</p>
                    <p>Phone Number: {profile?.phone_number}</p>
                    <p>Identification Number: {profile?.identification_number}</p>
                    <button onClick={() => router.push('/profile/update')} className="bg-blue-500 text-white px-4 py-2 rounded">Update Doctor Profile</button>
                </div>
            )}

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}