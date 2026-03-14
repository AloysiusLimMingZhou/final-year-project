"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Activity, Beaker, FileSpreadsheet, Upload, ArrowLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_ML_API_ENDPOINT;

function normalizeCsv(raw: string): string {
    let text = raw.trim();

    if (text.startsWith('"') && text.endsWith('"')) {
        try { text = JSON.parse(text); } catch { }
    }
    text = text
        .replace(/\\r\\n/g, "\n")
        .replace(/\\r/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");

    return text;
}

export default function MLBatchPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [resultCsv, setResultCsv] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAdmin = (user?.roles || []).some((r: any) => String(r).toLowerCase() === "admin");

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.replace("/dashboard");
        }
    }, [loading, user, isAdmin, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResultCsv(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setResultCsv(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API}/predict/batch`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const csvText = await response.text();
            setResultCsv(normalizeCsv(csvText));
        } catch (err: any) {
            alert("Batch prediction failed: " + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const downloadResults = () => {
        if (!resultCsv) return;
        const excelFriendly = resultCsv.replace(/\n/g, "\r\n");
        const blob = new Blob([excelFriendly], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `batch_results_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading || (!user && !isAdmin)) {
        return <div className="py-10 text-sm opacity-60">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Button
                            variant="ghost"
                            className="p-1 h-auto text-sm"
                            onClick={() => router.push("/admin/ml")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Activity className="h-5 w-5 text-pink-500" />
                        <h1 className="text-xl font-semibold" style={{ color: "var(--hc-text)" }}>
                            Batch Prediction Test
                        </h1>
                    </div>
                    <p className="text-sm ml-8" style={{ color: "var(--hc-muted)" }}>
                        Upload a test CSV dataset to predict multiple instances simultaneously.
                    </p>
                </div>
            </div>

            <Card className="p-6 max-w-2xl mx-auto mt-8">
                <div className="text-center py-6">
                    <div
                        className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4"
                        style={{ background: "var(--hc-surface-active, #EFF6FF)" }}
                    >
                        <FileSpreadsheet className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-medium mb-2" style={{ color: "var(--hc-text)" }}>Upload CSV Dataset</h2>
                    <p className="text-sm opacity-70 mb-6">
                        Ensure your CSV headers match the model features exactly.
                    </p>

                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    {file ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-sm font-medium p-3 rounded-lg border mb-4 inline-flex items-center w-64">
                                <span className="truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={triggerFileSelect} variant="secondary">
                                    Change File
                                </Button>
                                <Button onClick={handleUpload} disabled={isUploading} variant="primary">
                                    {isUploading ? "Processing..." : "Run Batch Predict"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button onClick={triggerFileSelect}>
                            <Upload className="w-4 h-4 mr-2" />
                            Select CSV File
                        </Button>
                    )}

                </div>

                {resultCsv && (
                    <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--hc-border)" }}>
                        <h3 className="text-md font-medium mb-3 flex justify-between items-center" style={{ color: "var(--hc-text)" }}>
                            Prediction Results
                            <Button variant="secondary" onClick={downloadResults}>
                                Download CSV
                            </Button>
                        </h3>
                        {/* Dark-themed, column-by-column parsed CSV table */}
                        <div
                            className="border rounded overflow-auto max-h-72"
                            style={{
                                background: "#0f172a",
                                borderColor: "rgba(255,255,255,0.1)",
                            }}
                        >
                            <table className="w-full text-xs border-collapse" style={{ minWidth: "max-content" }}>
                                <thead>
                                    <tr style={{ background: "rgba(255,255,255,0.07)" }}>
                                        {resultCsv.trim().split("\n")[0].split(",").map((header, i) => (
                                            <th
                                                key={i}
                                                className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                                                style={{
                                                    color: "#93c5fd",
                                                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                                                    borderRight: "1px solid rgba(255,255,255,0.06)",
                                                }}
                                            >
                                                {header.trim()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {resultCsv.trim().split("\n").slice(1).map((row, ri) => (
                                        <tr
                                            key={ri}
                                            style={{
                                                background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)",
                                            }}
                                        >
                                            {row.split(",").map((cell, ci) => (
                                                <td
                                                    key={ci}
                                                    className="px-3 py-2 whitespace-nowrap"
                                                    style={{
                                                        color: "#e2e8f0",
                                                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                        borderRight: "1px solid rgba(255,255,255,0.04)",
                                                    }}
                                                >
                                                    {cell.trim()}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
