"use client"

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";

export default function UpdateBlog() {
    const { user, loading } = useAuth();
    const [error, setError] = useState('');
    const [blog, setBlog] = useState<any>();
    const [categories, setCategories] = useState<any[]>([])
    const [category, setCategory] = useState('')
    const router = useRouter();
    const params = useParams<{ blog: string }>();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [loading, user, router])

    const fetchExistingData = async () => {
        const response = await fetch(`/api/posts/${params.blog}`);
        const data = await response.json();
        setBlog(data);
        setCategory(data.category);
    }

    useEffect(() => {
        if (!loading && params.blog) fetchExistingData();
    }, [loading, params.blog]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/posts/category');
            const data = await response.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
            setCategories(["Heart", "Lifestyle", "Nutrition", "Fitness", "General"]);
        }
    }

    useEffect(() => {
        fetchCategories();
    }, [])

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBlog((prevBlog: any) => ({
            ...prevBlog,
            [name]: value,
        }));
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const category = formData.get('category') as string;

        try {
            const response = await fetch(`/api/posts/${params.blog}/update-post`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    category
                })
            })

            if (response.ok) {
                router.push('/blogs')
            }
        } catch (error) {
            console.log(error)
            setError("Failed to update post")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 max-w-sm mx-auto">
            <h1 className="text-2xl font-bold">Update Post</h1>
            {error && <p className="text-red-500">{error}</p>}
            <input className="border p-2 rounded" type="text" name="title" placeholder="Title" value={blog?.title ?? ""} onChange={handleInputChange} required />
            <textarea className="border p-2 rounded" name="content" placeholder="Content" value={blog?.content ?? ""} onChange={handleInputChange} required />
            <label>Category</label>
            <select name="category" className="border p-2 rounded" value={blog?.category} onChange={handleInputChange}>
                {categories.map((category: any) => (
                    <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                    </option>
                ))}
            </select>
            <button className="bg-blue-500 text-white p-2 rounded" type="submit">Update Blog</button>
        </form>
    )
}