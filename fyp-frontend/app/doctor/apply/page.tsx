"use client"

import { FormEvent, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"

export default function DoctorApply() {
    const { user, loading } = useAuth();
    const [error, setError] = useState("");
    const [typeOfRegistrations, setTypeOfRegistrations] = useState<string[]>([]);
    const [typeOfRegistration, setTypeOfRegistration] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [loading, user, router])

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

    if (loading) return <div>Loading...</div>

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("");

        const formData = new FormData(e.currentTarget)
        const specialization = formData.get("specialization") as string
        const graduated_from = formData.get("graduated_from") as string
        const place_of_practice = formData.get("place_of_practice") as string
        const years_of_experience = Number(formData.get("years_of_experience")) as number
        const type_of_registration = formData.get("type_of_registration") as string
        const phone_number = formData.get("phone_number") as string
        const identification_number = formData.get("identification_number") as string
        const file = formData.get("file") as File

        try {
            const response = await fetch("/api/doctors/apply", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                router.push("/dashboard");
            } else {
                const errorData = await response.json().catch(() => { });
                setError(errorData?.message || "Failed to apply");
            }

        } catch (err) {
            setError("Failed to apply");
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-sm mx-auto">
                <h1 className="text-2xl font-bold">Doctor Verification</h1>
                {error && <p className="text-red-500">{error}</p>}
                <input className="border p-2 rounded" type="text" name="specialization" placeholder="Specialization" required />
                <input className="border p-2 rounded" type="text" name="place_of_practice" placeholder="Place of Practice" required />
                <input className="border p-2 rounded" type="number" name="years_of_experience" placeholder="Years of Experience" required />
                <input className="border p-2 rounded" type="text" name="graduated_from" placeholder="Graduated From" required />
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
                <input className="border p-2 rounded" type="text" name="phone_number" placeholder="Phone Number" required />
                <input className="border p-2 rounded" type="text" name="identification_number" placeholder="Identification Number" required />
                <label className="p-2">Upload Doctor License</label>
                <input className="border p-2 rounded" type="file" name="file" accept=".pdf" required />
                <button className="bg-blue-500 text-white p-2 rounded" type="submit">Apply</button>
            </form>

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}