"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import SoftSelect from "../../components/ui/Select";
import { Activity, Beaker, CheckCircle2, RotateCcw } from "lucide-react";

// The FastAPI base URL runs on port 8002
const API = process.env.NEXT_PUBLIC_ML_API_ENDPOINT;

export default function MLMonitoringPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
    const [artifacts, setArtifacts] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [plotMetric, setPlotMetric] = useState("roc_auc");
    const [plotUrl, setPlotUrl] = useState<string | null>(null);

    const isAdmin = (user?.roles || []).some((r: any) => String(r).toLowerCase() === "admin");

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.replace("/dashboard");
        }
    }, [loading, user, isAdmin, router]);

    useEffect(() => {
        if (user && isAdmin) {
            refreshData();
        }
    }, [user, isAdmin]);

    const refreshData = async () => {
        setIsRefreshing(true);
        setPlotUrl(null);
        try {
            // Get healthy/active artifact
            const hRes = await fetch(`${API}/healthz`);
            const hJson = await hRes.json();
            const activePath = hJson?.artifact || hJson?.active || null;
            setActiveArtifact(activePath);

            // Get list of artifacts
            const lRes = await fetch(`${API}/admin/list_artifacts`);
            const lJson = await lRes.json();
            setArtifacts(lJson?.artifacts || []);
        } catch (err) {
            console.error("Failed to refresh ML data:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const activateModel = async (path: string, fallbackName: string) => {
        try {
            let resp = await fetch(`${API}/admin/activate_model`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ artifact: path }),
            });

            if (resp.status === 405 || resp.status === 404) {
                resp = await fetch(`${API}/admin/activate_model?artifact=${encodeURIComponent(path)}`, {
                    method: "GET",
                });
            }

            if (resp.status === 404) {
                const label = fallbackName.replace(/\.pkl$/i, "");
                resp = await fetch(`${API}/admin/activate_by_label`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ label }),
                });
            }

            await resp.json();
            alert("Activated model successfully!");
            refreshData();
        } catch (e) {
            alert("Activation failed: " + e);
        }
    };

    const generatePlot = () => {
        // Attempt preferred plot endpoint
        setPlotUrl(`${API}/admin/compare_models_plot?metric=${plotMetric}&_t=${Date.now()}`);
    };

    if (loading || (!user && !isAdmin)) {
        return <div className="py-10 text-sm opacity-60">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-5 w-5 text-pink-500" />
                        <h1 className="text-xl font-semibold" style={{ color: "var(--hc-text)" }}>
                            ML Model Monitoring
                        </h1>
                    </div>
                    <p className="text-sm" style={{ color: "var(--hc-muted)" }}>
                        Monitor and benchmark active Heart Disease prediction models.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => router.push("/admin/ml/batch")} variant="secondary">
                        <Beaker className="w-4 h-4 mr-2" />
                        Batch Testing
                    </Button>
                    <Button onClick={refreshData} disabled={isRefreshing} variant="secondary">
                        <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h2 className="text-lg font-medium mb-4 flex justify-between items-center" style={{ color: "var(--hc-text)" }}>
                        Available Models
                        <span className="text-xs font-normal opacity-60">
                            Active model will be used by all client requests
                        </span>
                    </h2>
                    <div className="space-y-3">
                        {artifacts.length === 0 ? (
                            <p className="text-sm opacity-50">No artifacts found.</p>
                        ) : (
                            artifacts.map((path) => {
                                const fname = String(path).split(/[/\\]/).pop() || "";
                                const isActive = activeArtifact && String(activeArtifact) === String(path);

                                return (
                                    <div
                                        key={path}
                                        className="flex items-center justify-between p-3 rounded-lg border text-sm"
                                        style={{
                                            background: isActive ? "var(--hc-surface-active, rgba(59, 130, 246, 0.05))" : "var(--hc-surface)",
                                            borderColor: isActive ? "var(--hc-accent, #3B82F6)" : "var(--hc-border)"
                                        }}
                                    >
                                        <span className="truncate mr-4" style={{ color: "var(--hc-text)" }}>{fname}</span>
                                        {isActive ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                            </span>
                                        ) : (
                                            <Button onClick={() => activateModel(path, fname)} variant="secondary" className="h-8 text-sm px-2">
                                                Activate
                                            </Button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-medium mb-4" style={{ color: "var(--hc-text)" }}>
                        Performance Evaluation
                    </h2>
                    <div className="flex gap-2 mb-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs mb-1 opacity-70" style={{ color: "var(--hc-text)" }}>Metric</label>
                            <SoftSelect
                                value={plotMetric}
                                onChange={(v) => setPlotMetric(v)}
                                options={[
                                    { value: "roc_auc", label: "ROC AUC" },
                                    { value: "accuracy", label: "Accuracy" },
                                    { value: "precision", label: "Precision" },
                                    { value: "recall", label: "Recall" },
                                    { value: "f1", label: "F1 Score" },
                                ]}
                            />
                        </div>
                        <Button onClick={generatePlot}>Generate Plot</Button>
                    </div>

                    <div
                        className="flex items-center justify-center border rounded-lg overflow-hidden bg-gray-50/50 min-h-[300px]"
                        style={{ borderColor: "var(--hc-border)" }}
                    >
                        {plotUrl ? (
                            <img
                                src={plotUrl}
                                alt="Model comparison plot"
                                className="max-w-full h-auto object-contain"
                                onError={() => {
                                    setPlotUrl(null);
                                    alert("Plot Generation not supported on backend yet, or endpoint missing.");
                                }}
                            />
                        ) : (
                            <span className="text-xs opacity-50">Select a metric to view comparison</span>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
