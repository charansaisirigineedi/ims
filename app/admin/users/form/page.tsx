"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, UserPlus, Shield } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

import { Suspense } from "react";

function UserFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    const isEditing = !!userId;

    const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEditing) {
            fetchUser();
        }
    }, [userId]);

    const fetchUser = async () => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            const data = await res.json();
            setFormData({ name: data.name, email: data.email, password: "", role: data.role });
        } catch (err) {
            setError("Failed to load user data");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const url = isEditing ? `/api/admin/users/${userId}` : "/api/admin/users";
        const method = isEditing ? "PUT" : "POST";

        // Don't send password if editing and password field is empty
        const payload = isEditing && !formData.password
            ? { name: formData.name, email: formData.email, role: formData.role }
            : formData;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push("/admin/users");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to save user");
            }
        } catch (err) {
            setError("An error occurred");
        }
        setLoading(false);
    };

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <Link href="/admin/users" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    marginBottom: '2rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'var(--transition-fast)'
                }}
                    className="glass-interactive">
                    <ArrowLeft size={18} />
                    Back to Users
                </Link>

                <div className="glass" style={{ padding: '2.5rem', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{
                            background: 'var(--accent-light)',
                            padding: '12px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            {isEditing ? <Shield size={28} color="var(--accent-primary)" /> : <UserPlus size={28} color="var(--accent-primary)" />}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                {isEditing ? "Edit User" : "Create New User"}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                {isEditing ? "Update user information and permissions" : "Add a new user to the system"}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            color: '#991B1B',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input
                                required
                                type="text"
                                className="input-base"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address *</label>
                            <input
                                required
                                type="email"
                                className="input-base"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="e.g. john.doe@lab.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Password {isEditing && "(Leave blank to keep current)"}</label>
                            <input
                                required={!isEditing}
                                type="password"
                                className="input-base"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={isEditing ? "Enter new password to change" : "Enter password"}
                            />
                        </div>

                        <div className="form-group">
                            <label>Role *</label>
                            <select
                                className="input-base"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            >
                                <option value="user">User - Standard Access</option>
                                <option value="admin">Admin - Full Access</option>
                            </select>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                Admins have full access to all system features
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <Link href="/admin/users" className="glass-interactive" style={{
                                flex: 1,
                                padding: '12px',
                                fontSize: '0.95rem',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                background: 'transparent',
                                textAlign: 'center',
                                textDecoration: 'none',
                                color: 'var(--text-secondary)',
                                fontWeight: 600
                            }}>
                                Cancel
                            </Link>
                            <button type="submit" disabled={loading} className="button-primary" style={{
                                flex: 1,
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}>
                                <Save size={18} />
                                {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default function UserFormPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UserFormContent />
        </Suspense>
    );
}
