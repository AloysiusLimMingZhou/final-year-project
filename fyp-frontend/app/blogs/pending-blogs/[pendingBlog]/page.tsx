"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../context/AuthContext"
import { useRouter, useParams } from "next/navigation"

export default function GetPendingBlogById() {
    const { user, loading } = useAuth();
    const [pendingPost, setPendingPost] = useState<any>(null);
    const router = useRouter();
    const params = useParams<{
        pendingBlog: string
    }>();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router])

    const fetchPendingPost = async () => {
        try {
            const response = await fetch(`/api/posts/${params.pendingBlog}/pending-posts`);
            const data = await response.json();
            setPendingPost(data);
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        fetchPendingPost();
    }, [params.pendingBlog]);

    if (loading) return <div>Loading...</div>

    if (!user?.roles.includes('doctor')) {
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

    const truncateWords = (text: string, limit: number) => {
        if (!text) return '';
        const words = text.split(/\s+/);
        if (words.length <= limit) return text;

        return words.slice(0, limit).join(' ') + "...";
    }

    return (
        <div>
            <h1>Title: {pendingPost?.title}</h1>
            <p>Created By: {pendingPost?.author_name}</p>
            <p>Created At: {pendingPost?.created_at}</p>
            <p>Updated At: {pendingPost?.updated_at}</p>
            <p>Category: {pendingPost?.category}</p>
            {pendingPost?.reviewed_at &&
                <p>Reviewed By: {pendingPost.reviewer_name} At: {pendingPost.reviewed_at}</p>
            }
            <p>{truncateWords(pendingPost.content, 150)}</p>
            <button onClick={() => router.push('/blogs/pending-blogs')} className="bg-blue-500 text-white px-4 py-2 rounded">Back to Pending Blogs</button>
            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )

}