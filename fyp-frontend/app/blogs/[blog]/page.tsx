"use client"

import { useAuth } from '../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';


export default function BlogPage() {
    const { user, loading } = useAuth();
    const [post, setPost] = useState<any>(null);
    const router = useRouter();
    const params = useParams<{ blog: string }>();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router])

    const fetchPost = async () => {
        const response = await fetch(`/api/posts/${params.blog}`);
        const data = await response.json();

        setPost(data);
    }

    useEffect(() => {
        if (!loading && params.blog) fetchPost();
    }, [loading, params.blog]);

    if (loading) return <div>Loading...</div>

    if (!post) return <div>404: Post Not Found</div>

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
            <p>{post.content}</p>
            <button onClick={() => router.push('/blogs')} className="bg-blue-500 text-white px-4 py-2 rounded">Back to blogs</button>
            {user?.roles.includes('doctor') && post?.user_id === user?.id && (
                <button onClick={() => router.push(`/blogs/${post.id}/update-blog`)} className="bg-blue-500 text-white px-4 py-2 rounded">Update Blog</button>
            )}
            {user?.roles.includes('admin') && (
                <button onClick={async () => await fetch(`/api/posts/${params.blog}/delete-post`, { method: 'DELETE' })} className="bg-red-500 text-white px-4 py-2 rounded">Delete Blog</button>
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