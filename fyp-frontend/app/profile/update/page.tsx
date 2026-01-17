"use client"

import React, { useState, useEffect, FormEvent } from "react"
import { useAuth } from '../../context/AuthContext'
import { useRouter } from "next/navigation"

export default function UpdateProfile() {
    const { user, loading } = useAuth();
    const [profile, setProfile] = useState<any>();
    const [sexCategories, setSexCategories] = useState<string[]>([]);
    const [sexCategory, setSexCategory] = useState("");
    const [typeOfRegistrations, setTypeOfRegistrations] = useState<string[]>([]);
    const [typeOfRegistration, setTypeOfRegistration] = useState("");
    const router = useRouter();

    const fetchSexCategory = async () => {
        try {
            const response = await fetch("/api/users/sex-category");
            const data = await response.json();
            setSexCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log(err);
            setSexCategories(['male', 'female'])
        }
    }

    useEffect(() => {
        fetchSexCategory();
    }, []);

    const fetchTypeOfRegistration = async () => {
        try {
            const response = await fetch("/api/doctors/type-of-registration");
            const data = await response.json();
            setTypeOfRegistrations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log(err);
            setTypeOfRegistrations(['Full Registration', 'Provisional Registration', 'TPC Number']);
        }
    }

    useEffect(() => {
        fetchTypeOfRegistration();
    }, []);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prevProfile: any) => ({
            ...prevProfile,
            [name]: value,
        }));
    }

    const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const age = formData.get('age') as string;
        const emergency_contact_email = formData.get('emergency_contact_email') as string;
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, age, emergency_contact_email }),
        });
        if (response.ok) {
            router.push('/profile');
        }
    }

    const handleDoctorProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const specialization = formData.get('specialization') as string;
        const graduated_from = formData.get('graduated_from') as string;
        const place_of_practice = formData.get('place_of_practice') as string;
        const type_of_registration = formData.get('type_of_registration') as string;
        const years_of_experience = formData.get('years_of_experience') as string;
        const phone_number = formData.get('phone_number') as string;
        const identification_number = formData.get('identification_number') as string;
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ specialization, graduated_from, place_of_practice, years_of_experience, type_of_registration, phone_number, identification_number })
        })
        if (response.ok) {
            router.push('/profile');
        }
    }

    if (loading) return <p>Loading...</p>

    return (
        <div>
            <h1>Update Profile</h1>
            <form onSubmit={handleProfileSubmit}>
                <input type="text" placeholder="Name" value={profile?.name ?? ""} name="name" onChange={handleInputChange} />
                <input type="number" placeholder="Age" value={profile?.age ?? ""} name="age" onChange={handleInputChange} />
                <input type="email" placeholder="Emergency Contact Email" value={profile?.emergency_contact_email ?? ""} name="emergency_contact_email" onChange={handleInputChange} />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update Profile</button>
            </form>

            {user?.roles.includes('doctor') && (
                <form onSubmit={handleDoctorProfileSubmit}>
                    <input type="text" placeholder="Specialization" value={profile?.specialization ?? ""} name="specialization" onChange={handleInputChange} />
                    <input type="text" placeholder="Graduated From" value={profile?.graduated_from ?? ""} name="graduated_from" onChange={handleInputChange} />
                    <input type="text" placeholder="Place of Practice" value={profile?.place_of_practice ?? ""} name="place_of_practice" onChange={handleInputChange} />
                    <input type="number" placeholder="Years of Experience" value={profile?.years_of_experience ?? ""} name="years_of_experience" onChange={handleInputChange} />
                    <select
                        value={typeOfRegistration}
                        onChange={(e) => setTypeOfRegistration(e.target.value)}
                        name="type_of_registration"
                    >
                        {typeOfRegistrations && typeOfRegistrations.map((registration) => (
                            <option key={registration} value={registration}>
                                {registration}
                            </option>
                        ))}
                    </select>
                    <input type="text" placeholder="Phone Number" value={profile?.phone_number ?? ""} name="phone_number" onChange={handleInputChange} />
                    <input type="text" placeholder="Identification Number" value={profile?.identification_number ?? ""} name="identification_number" onChange={handleInputChange} />
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update Doctor Profile</button>
                </form>
            )}

            <button onClick={() => router.push('/profile')} className="bg-green-500 text-white px-4 py-2 rounded">Back to Profile</button>
        </div>
    )
}