"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Stethoscope, ChevronLeft, Upload, AlertTriangle, X, ShieldAlert, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function DoctorApply() {
    const { user, loading: authLoading } = useAuth();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [typeOfRegistrations, setTypeOfRegistrations] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [showFileWarning, setShowFileWarning] = useState(false);
    const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [authLoading, user, router]);

    const fetchTypeOfRegistration = async () => {
        try {
            const response = await fetch("/api/doctors/type-of-registration");
            const data = await response.json();
            setTypeOfRegistrations(Array.isArray(data) ? data : []);
        } catch {
            setTypeOfRegistrations(["Full Registration", "Provisional Registration", "TPC Number"]);
        }
    };

    useEffect(() => { fetchTypeOfRegistration(); }, []);

    if (authLoading) return <div className="py-10 text-sm text-center" style={{ color: "var(--hc-muted)" }}>Loading…</div>;

    // --- Status guard: if user already has a doctor application, show status ---
    if (user?.doctor_status) {
        const statusConfig: Record<string, { icon: React.ReactNode; title: string; description: string; color: string }> = {
            pending: {
                icon: <Clock className="h-8 w-8" style={{ color: "#F59E0B" }} />,
                title: "Application Pending",
                description: "Your doctor application is currently under review. You will be notified once it has been processed.",
                color: "rgba(245,158,11,0.1)",
            },
            approved: {
                icon: <CheckCircle2 className="h-8 w-8" style={{ color: "#10B981" }} />,
                title: "Already Approved",
                description: "You are already an approved doctor. You can publish blog posts and access doctor features.",
                color: "rgba(16,185,129,0.1)",
            },
            rejected: {
                icon: <XCircle className="h-8 w-8" style={{ color: "#EF4444" }} />,
                title: "Application Rejected",
                description: "Your doctor application was rejected. You cannot submit another application.",
                color: "rgba(239,68,68,0.1)",
            },
            revoked: {
                icon: <ShieldAlert className="h-8 w-8" style={{ color: "#EF4444" }} />,
                title: "Doctor Status Revoked",
                description: "Your doctor status has been revoked by an administrator. You cannot re-apply.",
                color: "rgba(239,68,68,0.1)",
            },
        };

        const cfg = statusConfig[user.doctor_status] ?? statusConfig.pending;

        return (
            <div className="space-y-4 max-w-2xl mx-auto">
                <Button variant="secondary" onClick={() => router.push("/dashboard")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                    Back to Dashboard
                </Button>
                <Card title="Doctor Application">
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <div className="rounded-2xl p-4 border" style={{ borderColor: "var(--hc-border)", background: cfg.color }}>
                            {cfg.icon}
                        </div>
                        <h3 className="text-lg font-semibold" style={{ color: "var(--hc-text)" }}>{cfg.title}</h3>
                        <p className="text-sm max-w-md" style={{ color: "var(--hc-muted)" }}>{cfg.description}</p>
                        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                            Return to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    function validateForm(formData: FormData): boolean {
        const errors: Record<string, string> = {};

        const specialization = (formData.get("specialization") as string || "").trim();
        const placeOfPractice = (formData.get("place_of_practice") as string || "").trim();
        const graduatedFrom = (formData.get("graduated_from") as string || "").trim();
        const yearsOfExperience = formData.get("years_of_experience") as string || "";
        const phoneNumber = (formData.get("phone_number") as string || "").trim();
        const identificationNumber = (formData.get("identification_number") as string || "").trim();
        const file = formData.get("file") as File | null;

        // String fields must contain at least one alphabetic character
        const hasAlpha = /[a-zA-Z]/;
        if (!hasAlpha.test(specialization)) {
            errors.specialization = "Specialization must contain alphabetic characters.";
        }
        if (!hasAlpha.test(placeOfPractice)) {
            errors.place_of_practice = "Place of practice must contain alphabetic characters.";
        }
        if (!hasAlpha.test(graduatedFrom)) {
            errors.graduated_from = "Graduated from must contain alphabetic characters.";
        }

        // No negative numbers
        if (yearsOfExperience && Number(yearsOfExperience) < 0) {
            errors.years_of_experience = "Years of experience cannot be negative.";
        }

        // Phone number: reject if it parses as negative (leading minus)
        if (phoneNumber.startsWith("-")) {
            errors.phone_number = "Phone number cannot be negative.";
        }

        // Identification number: reject if it starts with a minus
        if (identificationNumber.startsWith("-")) {
            errors.identification_number = "Identification number cannot be negative.";
        }

        // PDF license file check
        if (!file || file.size === 0) {
            setShowFileWarning(true);
            setValidationErrors(errors);
            return false;
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const formData = new FormData(e.currentTarget);

        if (!validateForm(formData)) return;

        // Show confirmation popup instead of submitting directly
        setPendingFormData(formData);
        setShowConfirmPopup(true);
    };

    const handleConfirmedSubmit = async () => {
        if (!pendingFormData) return;
        setShowConfirmPopup(false);
        setSubmitting(true);

        try {
            const response = await fetch("/api/doctors/apply", {
                method: "POST",
                body: pendingFormData,
            });
            if (response.ok) {
                router.push("/dashboard");
            } else {
                const errData = await response.json().catch(() => ({}));
                setError(errData?.message || "Failed to submit application");
            }
        } catch {
            setError("Failed to submit application. Please try again.");
        } finally {
            setSubmitting(false);
            setPendingFormData(null);
        }
    };

    const inputCls = "w-full rounded-xl border px-3 py-2.5 text-sm bg-transparent transition focus:outline-none focus-visible:ring-2";
    const inputStyle = { borderColor: "var(--hc-border)", color: "var(--hc-text)" };
    const errorStyle = { borderColor: "#EF4444", color: "var(--hc-text)" };

    const fields = [
        { name: "specialization", label: "Specialization", type: "text", placeholder: "e.g. Cardiology" },
        { name: "place_of_practice", label: "Place of Practice", type: "text", placeholder: "e.g. City General Hospital" },
        { name: "graduated_from", label: "Graduated From", type: "text", placeholder: "e.g. University of Malaya" },
        { name: "years_of_experience", label: "Years of Experience", type: "number", placeholder: "e.g. 5" },
        { name: "phone_number", label: "Phone Number", type: "text", placeholder: "e.g. +60123456789" },
        { name: "identification_number", label: "Identification Number (IC/Passport)", type: "text", placeholder: "e.g. 900101-14-5678" },
    ];

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {/* Confirmation Popup */}
            {showConfirmPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                >
                    <div
                        className="relative rounded-2xl border p-6 shadow-2xl max-w-md w-full mx-4"
                        style={{ background: "var(--hc-surface, var(--surface))", borderColor: "var(--hc-border, var(--borderSoft))", color: "var(--hc-text, var(--text))" }}
                    >
                        <button
                            onClick={() => setShowConfirmPopup(false)}
                            className="absolute top-3 right-3 p-1 rounded-lg transition-colors hover:bg-black/10"
                        >
                            <X className="h-4 w-4" style={{ color: "var(--hc-muted, var(--muted))" }} />
                        </button>
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div
                                className="rounded-2xl p-3 border"
                                style={{ borderColor: "var(--hc-border, var(--borderSoft))", background: "rgba(251,146,60,0.1)" }}
                            >
                                <AlertTriangle className="h-8 w-8" style={{ color: "#FB923C" }} />
                            </div>
                            <h3 className="text-lg font-semibold">Confirm Submission</h3>
                            <p className="text-sm" style={{ color: "var(--hc-muted, var(--muted))" }}>
                                <strong>You can only submit one application per account.</strong><br />
                                Once submitted, you will not be able to submit another application.
                                Are you sure you want to proceed?
                            </p>
                            <div className="flex gap-3 w-full">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowConfirmPopup(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleConfirmedSubmit}
                                >
                                    Yes, Submit
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Missing Warning Popup */}
            {showFileWarning && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                >
                    <div
                        className="relative rounded-2xl border p-6 shadow-2xl max-w-md w-full mx-4"
                        style={{ background: "var(--hc-surface, var(--surface))", borderColor: "var(--hc-border, var(--borderSoft))", color: "var(--hc-text, var(--text))" }}
                    >
                        <button
                            onClick={() => setShowFileWarning(false)}
                            className="absolute top-3 right-3 p-1 rounded-lg transition-colors hover:bg-black/10"
                        >
                            <X className="h-4 w-4" style={{ color: "var(--hc-muted, var(--muted))" }} />
                        </button>
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div
                                className="rounded-2xl p-3 border"
                                style={{ borderColor: "var(--hc-border, var(--borderSoft))", background: "rgba(239,68,68,0.1)" }}
                            >
                                <AlertTriangle className="h-8 w-8" style={{ color: "#EF4444" }} />
                            </div>
                            <h3 className="text-lg font-semibold">License PDF Required</h3>
                            <p className="text-sm" style={{ color: "var(--hc-muted, var(--muted))" }}>
                                Please upload your doctor license as a PDF file before submitting your application.
                                This document is required for verification.
                            </p>
                            <Button onClick={() => setShowFileWarning(false)}>
                                OK, I&apos;ll Upload
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Button variant="secondary" onClick={() => router.push("/dashboard")} iconLeft={<ChevronLeft className="h-4 w-4" />}>
                Back to Dashboard
            </Button>

            <Card
                title="Doctor Application"
                headerRight={
                    <div className="rounded-xl p-2" style={{ background: "rgba(16,185,129,0.1)" }}>
                        <Stethoscope className="h-4 w-4" style={{ color: "#10B981" }} />
                    </div>
                }
            >
                <p className="text-sm mb-5" style={{ color: "var(--hc-muted)" }}>
                    Submit your credentials for review. Once approved, you will be granted doctor status and can publish health blog posts.
                </p>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map(({ name, label, type, placeholder }) => (
                            <div key={name} className="space-y-1.5">
                                <label className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>{label} <span style={{ color: "#EF4444" }}>*</span></label>
                                <input
                                    className={inputCls}
                                    style={validationErrors[name] ? errorStyle : inputStyle}
                                    type={type}
                                    name={name}
                                    placeholder={placeholder}
                                    required
                                    min={type === "number" ? 0 : undefined}
                                />
                                {validationErrors[name] && (
                                    <div className="text-xs" style={{ color: "#EF4444" }}>
                                        {validationErrors[name]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>Type of Registration <span style={{ color: "#EF4444" }}>*</span></label>
                        <select name="type_of_registration" className={inputCls} style={inputStyle} required>
                            {typeOfRegistrations.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* File upload */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>Doctor License (PDF) <span style={{ color: "#EF4444" }}>*</span></label>
                        <label
                            className="flex flex-col items-center gap-2 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition hover:bg-blue-50"
                            style={{ borderColor: "var(--hc-border)" }}
                        >
                            <Upload className="h-6 w-6" style={{ color: "var(--hc-muted)" }} />
                            <span className="text-sm" style={{ color: "var(--hc-muted)" }}>
                                {fileName ? fileName : "Click to upload PDF license"}
                            </span>
                            <input
                                type="file"
                                name="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                    setFileName(e.target.files?.[0]?.name || "");
                                    setShowFileWarning(false);
                                }}
                            />
                        </label>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Submitting…" : "Submit Application"}
                        </Button>
                        <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
