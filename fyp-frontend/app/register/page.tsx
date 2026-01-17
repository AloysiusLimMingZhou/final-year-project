"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [sexCategories, setSexCategories] = useState<string[]>([]);
    const [sexCategory, setSexCategory] = useState("");

    const fetchSexCategory = async () => {
        try {
            const response = await fetch("/api/users/sex-category");
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                setSexCategories(data);
            } else {
                setSexCategories(['male', 'female']);
            }
        } catch (err) {
            console.log(err);
            setSexCategories(['male', 'female'])
        }
    }

    useEffect(() => {
        fetchSexCategory();
    }, []);

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/api/auth/google"
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const age = formData.get("age") as string;
        const sex = formData.get("sex") as string;
        const emergency_contact_email = formData.get("emergency_contact_email") as string;

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (response.ok) {
                router.push("/login");
            } else {
                setError("Failed to register");
            }
        } catch (err) {
            setError("Failed to register");
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-sm mx-auto">
                <h1 className="text-2xl font-bold">Register</h1>
                {error && <p className="text-red-500">{error}</p>}
                <input className="border p-2 rounded" type="text" placeholder="Username" name="name" required />
                <input className="border p-2 rounded" type="email" placeholder="Email" name="email" required />
                <input className="border p-2 rounded" type="number" placeholder="Age" name="age" required />
                <select
                    value={sexCategory}
                    onChange={(e) => setSexCategory(e.target.value)}
                    name="sex"
                    className="border p-2 rounded"
                >
                    <option value="">Select Sex</option>
                    {sexCategories && sexCategories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
                <input className="border p-2 rounded" type="email" placeholder="Emergency Contact Email" name="emergency_contact_email" />
                <input className="border p-2 rounded" type="password" placeholder="Password" name="password" required />
                <button className="bg-green-500 text-white p-2 rounded" type="submit">Register</button>
            </form>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="bg-white border border-gray-300 text-gray-700 p-2 rounded flex items-center justify-center gap-2 hover:bg-gray-50"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google" />
                Continue with Google
            </button>
        </div>
    );
}