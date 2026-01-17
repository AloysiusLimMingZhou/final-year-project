"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

interface HealthRecord {
    id: string;
    recorded_at: string;
    age: number;
    sex: number;
    cp: number;
    trestbps: number;
    chol: number;
    fbs: number;
    restecg: number;
    thalach: number;
    exang: number;
    oldpeak: number;
    slope: number;
    ca: number;
    thal: number;
    risk_score: number;
    band: string;
}

export default function Dashboard() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [tableHistory, setTableHistory] = useState<HealthRecord[]>([]);
    const [chartHistory, setChartHistory] = useState<HealthRecord[]>([]);

    const requestLocation = async () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by the browser!");
            return
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                await fetch('/api/users/location', {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude, longitude })
                })
            } catch (err) {
                console.error("Failed to update location", err);
            }
        },
            (err) => {
                console.error("Location Permission denied", err);
            }
        )
    }

    useEffect(() => {
        if (user) {
            requestLocation();
            fetch('/api/health/history')
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch history");
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        const sorted = [...data].reverse();
                        setChartHistory(sorted);
                        setTableHistory(data);
                    } else {
                        console.error("Data is not an array:", data);
                        setChartHistory([]);
                        setTableHistory([]);
                    }
                })
                .catch(err => console.error("Failed to fetch history", err));
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [loading, user, router])

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
            router.push('/login');
        } catch (err) {
            console.error("Failed to logout", err);
        }
    }

    const exportToCSV = async () => {
        if (tableHistory.length === 0) return;
        const header = ["Date", "Age", "Sex", "CP", "Trestbps", "Chol", "Fbs", "Restecg", "Thalach", "Exang", "Oldpeak", "Slope", "Ca", "Thal", "Risk Score", "Band"];

        const rows = tableHistory.map((record) => [
            new Date(record.recorded_at).toISOString().split('T')[0],
            record.age,
            record.sex,
            record.cp,
            record.trestbps,
            record.chol,
            record.fbs,
            record.restecg,
            record.thalach,
            record.exang,
            record.oldpeak,
            record.slope,
            record.ca,
            record.thal,
            record.risk_score,
            record.band
        ].join(','));
        const csvContent = header.concat(rows).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute("download", `health_history_${user?.name}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Health Dashboard</h1>
            <div className="bg-white p-6 rounded shadow">
                {chartHistory.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h3 className="text-lg font-bold mb-4 text-gray-700">Heart Disease Risk Trend</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer>
                                    <AreaChart data={chartHistory}>
                                        <defs>
                                            <linearGradient id="colorRisk" x1={0} y1={0} x2={0} y2={1}>
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="recorded_at" tickFormatter={formatDate} />
                                        <YAxis domain={[0, 1]} />
                                        <Tooltip labelFormatter={formatDate} />
                                        <Area type="monotone" dataKey="risk_score" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" name="Risk Score" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h3 className="text-lg font-bold mb-4 text-gray-700">Cholesterol Level (mg/dl)</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer>
                                    <LineChart data={chartHistory}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="recorded_at" tickFormatter={formatDate} />
                                        <YAxis domain={[0, 1]} />
                                        <Tooltip labelFormatter={formatDate} />
                                        <Line type="monotone" dataKey="chol" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} name="Cholesterol" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                            <h3 className="text-lg font-bold mb-4 text-gray-700">Blood Pressure vs Max Heart Rate</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer>
                                    <LineChart data={chartHistory}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="recorded_at" tickFormatter={formatDate} />
                                        <YAxis domain={[0, 1]} />
                                        <Tooltip labelFormatter={formatDate} />
                                        <Legend />
                                        <Line type="monotone" dataKey="trestbps" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} name="Resting Blood Pressure" />
                                        <Line type="monotone" dataKey="thalach" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 8 }} name="Max Heart Rate" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                <h2 className="text-xl font-bold mb-4">Recent Health Records</h2>
                {tableHistory.length === 0 ? (
                    <p className="text-gray-500">No records found. Start by running a diagnosis.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr className="bg-gray-400">
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Age</th>
                                    <th className="px-4 py-2">Sex</th>
                                    <th className="px-4 py-2">CP</th>
                                    <th className="px-4 py-2">Tresbps</th>
                                    <th className="px-4 py-2">Chol</th>
                                    <th className="px-4 py-2">Fbs</th>
                                    <th className="px-4 py-2">RestECG</th>
                                    <th className="px-4 py-2">Thalach</th>
                                    <th className="px-4 py-2">Exang</th>
                                    <th className="px-4 py-2">Oldpeak</th>
                                    <th className="px-4 py-2">Slope</th>
                                    <th className="px-4 py-2">Ca</th>
                                    <th className="px-4 py-2">Thal</th>
                                    <th className="px-4 py-2">Risk Score</th>
                                    <th className="px-4 py-2">Band</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-600">
                                {tableHistory.map(record => (
                                    <tr key={record.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{new Date(record.recorded_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{record.age}</td>
                                        <td className="px-4 py-2">{record.sex}</td>
                                        <td className="px-4 py-2">{record.cp}</td>
                                        <td className="px-4 py-2">{record.trestbps}</td>
                                        <td className="px-4 py-2">{record.chol}</td>
                                        <td className="px-4 py-2">{record.fbs}</td>
                                        <td className="px-4 py-2">{record.restecg}</td>
                                        <td className="px-4 py-2">{record.thalach}</td>
                                        <td className="px-4 py-2">{record.exang}</td>
                                        <td className="px-4 py-2">{record.oldpeak}</td>
                                        <td className="px-4 py-2">{record.slope}</td>
                                        <td className="px-4 py-2">{record.ca}</td>
                                        <td className="px-4 py-2">{record.thal}</td>
                                        <td className="px-4 py-2">{(record.risk_score * 100).toFixed(2)}%</td>
                                        <td className={`px-4 py-2 font-bold ${record.band === 'High' ? 'text-red-600' :
                                            record.band === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                                            }`}>
                                            {record.band}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={exportToCSV}>Export to CSV</button>
                    </div>
                )}
            </div>
            <div className="mt-8 flex gap-4">
                <button onClick={() => router.push('/diagnosis')} className="bg-blue-500 text-white px-4 py-2 rounded">New Diagnosis</button>
                <button onClick={() => router.push('/chat')} className="bg-green-500 text-white px-4 py-2 rounded">Ask Chatbot</button>
                <button onClick={() => router.push('/profile')} className="bg-purple-500 text-white px-4 py-2 rounded">Profile</button>
                <button onClick={() => router.push('/blogs')} className="bg-yellow-500 text-white px-4 py-2 rounded">Blogs</button>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
            </div>
        </div>
    );
}
