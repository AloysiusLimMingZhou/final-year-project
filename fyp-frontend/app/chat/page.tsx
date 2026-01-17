"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

interface Message {
    role: "user" | "assistant";
    content: string;
    citations?: string[];
}

export default function Chat() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (user) {
            fetch('/api/chat/history')
                .then(res => {
                    if (res.ok) return res.json();
                    return [];
                })
                .then(data => {
                    setMessages(data);
                })
                .catch(err => console.log("No history or failed fetch", err));
        }
    }, [user]);

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [loading, user, router])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const question = input;
        setInput("");
        setSending(true);

        const newMsgs = [...messages, { role: "user" as const, content: question }];
        setMessages(newMsgs);

        try {
            const response = await fetch("/api/chat/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages([...newMsgs, {
                    role: "assistant",
                    content: data.answer,
                    citations: data.citation
                }]);
            } else {
                const errMsg = data.message || "You have reached the limit of the chat session. Please try again 6 hours later!"
                setMessages([...newMsgs, { role: "assistant", content: errMsg }]);
            }
        } catch (err) {
            setMessages([...newMsgs, { role: "assistant", content: "System: Network Error! Please try again later!" }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[80vh] p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4 border-b pb-2">Medical Assistant Chatbot</h1>

            <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded p-4 border space-y-4">
                {messages.length === 0 && <p className="text-gray-500 text-center">Ask me anything about heart health.</p>}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
                            }`}>
                            <p className="whitespace-pre-wrap max-w-[80%]">{msg.content}</p>
                            {msg.citations && msg.citations.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 max-w-[80%]">
                                    <strong>Sources:</strong>
                                    <ul className="list-disc pl-4">
                                        {msg.citations.map((cite, i) => (
                                            <li key={i}>{cite}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    className="flex-1 border p-3 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your health question..."
                    disabled={sending}
                />
                <button
                    type="submit"
                    disabled={sending}
                    className="bg-blue-600 text-white px-6 py-3 rounded font-semibold disabled:bg-gray-400 hover:bg-blue-700 transition"
                >
                    {sending ? "..." : "Send"}
                </button>
            </form>

            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/dashboard')} className="bg-blue-500 text-white px-4 py-2 rounded">Dashboard</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: "POST" }); router.push('/login') }} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    );
}
