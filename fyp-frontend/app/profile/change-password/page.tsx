"use client"

import { FormEvent, useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import { useRouter } from "next/navigation"

export default function ChangePassword() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [loading, user, router])

    const [step, setStep] = useState(1);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const verifyCurrentPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/auth/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: oldPassword }),
            });

            if (response.ok) {
                setStep(2);
            } else {
                setError('Incorrect Current Password');
            }
        } catch (err) {
            setError('Server error! Failed to Change Password');
        }
    }

    const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New Password and Confirm Password do not match');
            return;
        }

        if (!newPassword || newPassword === '') {
            setError('New Password cannot be empty');
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (response.ok) {
                router.push('/profile');
            } else {
                setError('Failed to change password');
            }
        } catch (err) {
            console.error(err);
            setError('Server error! Failed to Change Password');
        }
    }

    return (
        <div>
            {step === 1 ? (
                <div>
                    <h1>Verify Password</h1>
                    <form onSubmit={verifyCurrentPassword}>
                        <input type="password" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Verify Password</button>
                    </form>
                </div>
            ) : (
                <div>
                    <h1>Change Password</h1>
                    <form onSubmit={handleChangePassword}>
                        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Change Password</button>
                    </form>
                </div>
            )}
            {error && <p className="text-red-500">{error}</p>}
        </div>
    )
}