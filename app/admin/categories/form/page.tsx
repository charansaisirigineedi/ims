"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Tag } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CategoryFormPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categoryId = searchParams.get('id');
    const isEditing = !!categoryId;

    const [formData, setFormData] = useState({ name: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isEditing) {
            fetchCategory();
        }
    }, [categoryId]);

    const fetchCategory = async () => {
        try {
            const res = await fetch(`/api/categories/${categoryId}`);
            const data = await res.json();
            setFormData({ name: data.name });
        } catch (err) {
            setError("Failed to load category data");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const url = isEditing ? `/api/categories/${categoryId}` : "/api/categories";
        const method = isEditing ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/admin/categories");
            } else {
                setError("Failed to save category");
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
                <Link href="/admin/categories" style={{
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
                    Back to Categories
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
                            <Tag size={28} color="var(--accent-primary)" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                {isEditing ? "Edit Category" : "Create New Category"}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                {isEditing ? "Update category information" : "Add a new category for inventory classification"}
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
                            <label>Category Name *</label>
                            <input
                                required
                                type="text"
                                className="input-base"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Biological Hazards, Chemicals, Equipment"
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                Choose a descriptive name for this category
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <Link href="/admin/categories" className="glass-interactive" style={{
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
                                {loading ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
