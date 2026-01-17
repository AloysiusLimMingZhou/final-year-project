"use client"

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Blogs() {
    const { user, loading } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(2);
    const [category, setCategory] = useState('All');
    const [categories, setCategories] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [loading, user, router])

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/posts/category');
            const data = await response.json();
            setCategories(["All", ...data]);
        } catch (err) {
            console.error(err);
            setCategories(["All", "Heart", "Lifestyle", "Nutrition", "Fitness", "General"]);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, [])

    const fetchPosts = async () => {
        const params = new URLSearchParams();
        if (search) {
            params.set('search', search);
        }
        if (category && category !== 'All') {
            params.set('category', category);
        }
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        const response = await fetch(`/api/posts?${params.toString()}`);
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : []);
    }

    useEffect(() => {
        fetchPosts();
    }, [category, page, limit])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts();
    }

    const handleNextPagination = () => {
        setPage(page + 1);
    }

    const handlePreviousPagination = () => {
        setPage(page - 1);
    }

    if (loading) return (<div>Loading...</div>)

    const truncateWords = (text: string, limit: number) => {
        if (!text) return '';
        const words = text.split(/\s+/);
        if (words.length <= limit) return text;

        return words.slice(0, limit).join(' ') + "...";
    }

    return (
        <div>
            <div>
                <form onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        placeholder="Search title or content"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Search</button>
                </form>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    {categories.map((category: any) => (
                        <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                {posts && posts.map((post: any) => (
                    <div key={post.id}>
                        <h1>Title: {post.title}</h1>
                        <p>By: {post.author_name}</p>
                        <p>Created At: {post.created_at}</p>
                        <p>Updated At: {post.updated_at}</p>
                        <p>Category: {post.category}</p>
                        {post.reviewed_at && (
                            <p>Reviewed By: {post.reviewer_name} at: {post.reviewed_at}</p>
                        )}
                        <p>{truncateWords(post.content, 150)}</p>
                        <button onClick={() => router.push(`/blogs/${post.id}`)}>Read More</button>
                    </div>
                ))}
                {page > 1 &&
                    <button onClick={handlePreviousPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Previous Page</button>
                }
                {posts.length === limit &&
                    <button onClick={handleNextPagination} className="bg-blue-500 text-white px-4 py-2 rounded">Next Page</button>
                }
                {posts.length === 0 && <p>No posts found!</p>}
            </div>
            {user?.roles.includes('doctor') && (
                <div>
                    <button onClick={() => router.push('/blogs/create-blog')} className="bg-blue-500 text-white px-4 py-2 rounded">Create Blog</button>
                    <button onClick={() => router.push('/blogs/pending-blogs')} className="bg-blue-500 text-white px-4 py-2 rounded">My Pending Blogs</button>
                </div>
            )}

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    )
}