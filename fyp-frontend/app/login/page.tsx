"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const [error, setError] = useState("");

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:8080/api/auth/google";
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError("");

        const formData = new FormData(e.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            await login(email, password);
        } catch (err) {
            setError("Failed to login");
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-sm mx-auto">
                <h1 className="text-2xl font-bold">Login</h1>
                {error && <p className="text-red-500">{error}</p>}
                <input className="border p-2 rounded" type="email" name="email" placeholder="Email" required />
                <input className="border p-2 rounded" type="password" name="password" placeholder="Password" required />
                <button className="bg-blue-500 text-white p-2 rounded" type="submit">Login</button>
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
    )
}