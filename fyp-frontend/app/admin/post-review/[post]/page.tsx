"use client"

import { useEffect, useState } from "react"
import { useAuth } from '../../../context/AuthContext'
import { useRouter, useParams } from "next/navigation"

export default function ViewPostForReview() {
    const [post, setPost] = useState<any>(null);
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams<{ post: string }>();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router]);

    const fetchPost = async () => {
        const response = await fetch(`/api/posts/${params.post}/review-post`);
        const data = await response.json();
        setPost(data);
    }

    useEffect(() => {
        fetchPost();
    }, [params.post]);

    const approvePost = async () => {
        await fetch(`/api/posts/${params.post}/approve-post`, {
            method: "POST",
        })
        router.push('/admin/post-review');
    }

    const rejectPost = async () => {
        await fetch(`/api/posts/${params.post}/reject-post`, {
            method: "POST",
        })
        router.push('/admin/post-review');
    }

    if (loading) {
        return <div>Loading...</div>
    }

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

    if (!post) return <div>404: No post found</div>

    return (
        <div>
            <h1>Title: {post.title}</h1>
            <p>Created By: {post.author_name}</p>
            <p>Created At: {post.created_at}</p>
            <p>Updated At: {post.updated_at}</p>
            <p>Category: {post.category}</p>
            {post.reviewed_at &&
                <p>Reviewed By: {post.reviewer_name} At: {post.reviewed_at}</p>
            }
            <button onClick={approvePost} className="bg-green-500 text-white px-4 py-2 rounded">Approve</button>
            <button onClick={rejectPost} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )

}