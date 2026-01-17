"use client";

import { useAuth } from "../context/AuthContext";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Diagnosis() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [result, setResult] = useState<any>(null);
    const [isSending, setIsSending] = useState(false);
    const [highRisk, setHighRisk] = useState(false);
    const [mediumRisk, setMediumRisk] = useState(false);
    const [lowRisk, setLowRisk] = useState(false);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        };
    }, [loading, user, router])

    const fetchHospital = async () => {
        try {
            const response = await fetch('/api/health/hospitals');
            const data = await response.json();
            console.log(data);
            setHospitals(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error occured", err)
        } finally {
            setLoadingHospitals(false);
        }
    }

    useEffect(() => {
        if (result) {
            fetchHospital();
        }
    }, [result]);

    const sendEmergencyContactEmail = async () => {
        if (!user?.emergency_contact_email) {
            const confirmRedirect = window.confirm("Please add an emergency contact email!")
            if (confirmRedirect) {
                router.push('/profile/update');
            }
            return;
        }
        setIsSending(true);
        try {
            const res = await fetch('/api/users/send-emergency-contact-email', {
                method: "POST",
            });
            if (res.ok) {
                alert("Emergency alert email sent successfully to your emergency contact!")
            }
        } catch (err) {
            console.log(err);
            alert("Failed to send emergency alert email. Please try again later.")
        } finally {
            setIsSending(false);
        }
    }

    const sendAlertEmail = async () => {
        setIsSending(true);
        try {
            const res = await fetch('/api/users/send-alert-email', {
                method: "POST",
            });
            if (res.ok) {
                alert("Alert email sent successfully to your inbox!")
            }
        } catch (err) {
            console.log(err);
            alert("Failed to send alert email. Please try again later.")
        } finally {
            setIsSending(false);
        }
    }

    const downloadPDFReport = async () => {
        window.open('http://localhost:8080/api/users/diagnosis/download', '_blank');
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setResult(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        const payload = {
            age: Number(data.age),
            sex: Number(data.sex),
            cp: Number(data.cp),
            trestbps: Number(data.trestbps),
            chol: Number(data.chol),
            fbs: Number(data.fbs),
            restecg: Number(data.restecg),
            thalach: Number(data.thalach),
            exang: Number(data.exang),
            oldpeak: Number(data.oldpeak),
            slope: Number(data.slope),
            ca: Number(data.ca),
            thal: Number(data.thal),
            recorded_at: new Date().toISOString(),
        };

        try {
            const response = await fetch('/api/health/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const resData = await response.json();
                setResult(resData.prediction);

                const score = resData.prediction.risk_score;
                setHighRisk(score >= 0.7);
                setMediumRisk(score < 0.7 && score >= 0.4);
                setLowRisk(score < 0.4);
            } else {
                setError("Prediction failed. Please check inputs.");
            }
        } catch (err) {
            setError("Network error.");
        }
    };

    if (loading) return <div>Loading...</div>

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Health Diagnosis</h1>

            {result && lowRisk && (
                <div className="bg-green-100 p-6 rounded mb-8 border border-green-300">
                    <h2 className="text-2xl font-bold text-green-800">Results</h2>
                    <p className="text-lg">Risk Score: <strong>{(result.risk_score * 100).toFixed(2)}%</strong></p>
                    <p className="text-lg">Band: <strong>{result.band}</strong></p>
                    <p className="text-sm text-gray-600 mt-2">{result.disclaimer}</p>
                    <button onClick={sendAlertEmail} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">{isSending ? 'Sending...' : 'Send an alert email to my inbox'}</button>
                    <button onClick={downloadPDFReport} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">Download PDF Report</button>
                    <button onClick={() => router.push('/dashboard')} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                        Back to Dashboard
                    </button>
                    <button onClick={() => setResult(null)} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">
                        New Prediction
                    </button>
                </div>
            )}

            {result && mediumRisk && (
                <div className="bg-yellow-100 p-6 rounded mb-8 border border-yellow-300">
                    <h2 className="text-2xl font-bold text-yellow-800">Results</h2>
                    <p className="text-lg">Risk Score: <strong>{(result.risk_score * 100).toFixed(2)}%</strong></p>
                    <p className="text-lg">Band: <strong>{result.band}</strong></p>
                    <p className="text-sm text-gray-600 mt-2">{result.disclaimer}</p>
                    <button onClick={sendAlertEmail} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">{isSending ? 'Sending...' : 'Send an alert email to my inbox'}</button>
                    <button onClick={downloadPDFReport} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">Download PDF Report</button>
                    <button onClick={() => router.push('/dashboard')} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                        Back to Dashboard
                    </button>
                    <button onClick={() => setResult(null)} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">
                        New Prediction
                    </button>
                </div>
            )}

            {result && highRisk && (
                <div className="bg-green-100 p-6 rounded mb-8 border border-red-300">
                    <h2 className="text-2xl font-bold text-red-800">Results</h2>
                    <p className="text-lg">Risk Score: <strong>{(result.risk_score * 100).toFixed(2)}%</strong></p>
                    <p className="text-lg">Band: <strong>{result.band}</strong></p>
                    <p className="text-sm text-gray-600 mt-2">{result.disclaimer}</p>
                    <p className="text-sm text-gray-600 mt-2">High risk detected. Please contact your emergency contact.</p>
                    <button onClick={sendEmergencyContactEmail} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">{isSending ? 'Sending...' : 'Send an email to my emergency contact'}</button>
                    <button onClick={sendAlertEmail} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">{isSending ? 'Sending...' : 'Send an alert email to my inbox'}</button>
                    <button onClick={downloadPDFReport} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">Download PDF Report</button>
                    <button onClick={() => router.push('/dashboard')} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
                        Back to Dashboard
                    </button>
                    <button onClick={() => setResult(null)} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">
                        New Prediction
                    </button>
                </div>
            )}

            {result && (
                <div className="mt-8 bg-white p-6 rounded shadow border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        Nearest Medical Centers
                        {user?.latitude
                            ? <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-1">Location is Active</span>
                            : <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Location is disabled</span>
                        }
                    </h3>

                    {!user?.latitude && (
                        <p className="text-red-500 mb-4">
                            We cannot find any medical centers nearby as you have disabled location access in your browser!
                            Please enable location in your browser and refresh!
                        </p>
                    )}

                    {loadingHospitals
                        ? (<p>Finding nearest clinics...</p>)
                        : hospitals.length > 0
                            ? (
                                <div>
                                    {hospitals.map((hospital, idx) => (
                                        <div key={idx} className="border p-4 rounded hover:bg-gray-50 transition">
                                            <p className="font-bold text-gray-800">{hospital.name}</p>
                                            <div className="flex justify-between mt-2 text-sm text-gray-600">
                                                <span className="capitalize">{hospital.type}</span>
                                                <span className="font-semibold text-blue-600">{hospital.distance} km away</span>
                                            </div>
                                            <a
                                                href={`http://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-500 hover:underline mt-2 block"
                                            >
                                                Get Direction
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )
                            : (
                                user?.latitude && <p>No hospital or clinics are found within 5km.</p>
                            )
                    }
                </div>
            )}

            {!result && (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded shadow">
                    <Input name="age" label="Age" type="number" />
                    <Select name="sex" label="Sex (1=M, 0=F)">
                        <option value="1">Male</option>
                        <option value="0">Female</option>
                    </Select>

                    <Select name="cp" label="Chest Pain Type (0-3)">
                        <option value="0">Typical Angina</option>
                        <option value="1">Atypical Angina</option>
                        <option value="2">Non-anginal Pain</option>
                        <option value="3">Asymptomatic</option>
                    </Select>

                    <Input name="trestbps" label="Resting BP (mm Hg)" type="number" />
                    <Input name="chol" label="Cholesterol (mg/dl)" type="number" />

                    <Select name="fbs" label="Fasting Blood Sugar > 120">
                        <option value="0">False</option>
                        <option value="1">True</option>
                    </Select>

                    <Select name="restecg" label="Resting ECG (0-2)">
                        <option value="0">Normal</option>
                        <option value="1">ST-T Wave Abnormality</option>
                        <option value="2">LV Hypertrophy</option>
                    </Select>

                    <Input name="thalach" label="Max Heart Rate" type="number" />

                    <Select name="exang" label="Exercise Induced Angina">
                        <option value="0">No</option>
                        <option value="1">Yes</option>
                    </Select>

                    <Input name="oldpeak" label="Oldpeak (Depression)" type="number" step="0.1" />

                    <Select name="slope" label="Slope (0-2)">
                        <option value="0">Upsloping</option>
                        <option value="1">Flat</option>
                        <option value="2">Downsloping</option>
                    </Select>

                    <Input name="ca" label="Major Vessels (0-3)" type="number" />

                    <Select name="thal" label="Thalassemia (0-3)">
                        <option value="1">Normal</option>
                        <option value="2">Fixed Defect</option>
                        <option value="3">Reversable Defect</option>
                    </Select>

                    <div className="col-span-1 md:col-span-2 mt-4">
                        {error && <p className="text-red-500 mb-2">{error}</p>}
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700">
                            Run Prediction
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

function Input({ name, label, type = "text", step = "1" }: any) {
    return (
        <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">{label}</label>
            <input name={name} type={type} step={step} required className="border p-2 rounded" />
        </div>
    )
}

function Select({ name, label, children }: any) {
    return (
        <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">{label}</label>
            <select name={name} required className="border p-2 rounded">
                {children}
            </select>
        </div>
    )
}
