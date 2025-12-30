"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Database, AlertCircle } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

import { Suspense } from "react";

function InventoryFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const itemId = searchParams.get('id');
    const isEditing = !!itemId;

    const [formData, setFormData] = useState({
        name: "",
        lab_id: "",
        category_id: "",
        quantity: 0,
        unit: "",
        minStock: 0,
        expiryDate: "",
        status: "active"
    });

    const [labs, setLabs] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [labsRes, catsRes] = await Promise.all([
                    fetch("/api/labs"),
                    fetch("/api/categories")
                ]);
                const [labsData, catsData] = await Promise.all([
                    labsRes.json(),
                    catsRes.json()
                ]);
                setLabs(labsData);
                setCategories(catsData);

                if (isEditing) {
                    const itemRes = await fetch(`/api/inventory/${itemId}`);
                    const itemData = await itemRes.json();

                    if (itemData.error) {
                        setError(itemData.error);
                    } else {
                        setFormData({
                            name: itemData.name,
                            lab_id: itemData.lab_id?._id || itemData.lab_id,
                            category_id: itemData.category_id?._id || itemData.category_id,
                            quantity: itemData.quantity,
                            unit: itemData.unit,
                            minStock: itemData.minStock || 0,
                            expiryDate: itemData.expiryDate ? new Date(itemData.expiryDate).toISOString().split('T')[0] : "",
                            status: itemData.status || "active"
                        });
                    }
                }
            } catch (err) {
                setError("Failed to load necessary data.");
            }
            setInitialLoading(false);
        };
        fetchData();
    }, [itemId, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const url = isEditing ? `/api/inventory/${itemId}` : "/api/inventory";
        const method = isEditing ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/inventory");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to save entry.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        }
        setLoading(false);
    };

    if (initialLoading) {
        return (
            <>
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                    <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Initializing form...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <Link href="/inventory" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    marginBottom: '2rem',
                    fontSize: '0.9rem',
                    fontWeight: 500
                }} className="glass-interactive">
                    <ArrowLeft size={18} />
                    Return to Registry
                </Link>

                <div className="glass" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                        <div style={{
                            background: 'var(--accent-light)',
                            padding: '12px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            <Database size={28} color="var(--accent-primary)" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                {isEditing ? "Modify Asset" : "New Inventory Entry"}
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                {isEditing ? "Update details for the selected inventory item." : "Register a new asset into the centralized management system."}
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
                            marginBottom: '2rem',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'center'
                        }}>
                            <AlertCircle size={18} />
                            <span style={{ fontSize: '0.875rem' }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Asset Name *</label>
                            <input
                                required
                                type="text"
                                className="input-base"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Centrifuge Tube, Sodium Chloride"
                            />
                        </div>

                        <div className="form-group">
                            <label>Laboratory Site *</label>
                            <select
                                required
                                className="input-base"
                                value={formData.lab_id}
                                onChange={(e) => setFormData({ ...formData, lab_id: e.target.value })}
                            >
                                <option value="">Select Laboratory</option>
                                {labs.map(lab => <option key={lab._id} value={lab._id}>{lab.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Category Classification *</label>
                            <select
                                required
                                className="input-base"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Current Quantity *</label>
                            <input
                                required={!isEditing}
                                disabled={isEditing}
                                type="number"
                                min="0"
                                className="input-base"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                style={isEditing ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            />
                            {isEditing && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                                    Quantity can only be set when creating a new item. Use stock movement history to update quantities.
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Measure Unit *</label>
                            <input
                                required
                                type="text"
                                className="input-base"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="e.g. pcs, ml, kg"
                            />
                        </div>

                        <div className="form-group">
                            <label>Critical Stock Level (Min)</label>
                            <input
                                type="number"
                                min="0"
                                className="input-base"
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Expiry Date (Optional)</label>
                            <input
                                type="date"
                                className="input-base"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                            />
                        </div>

                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <Link href="/inventory" className="glass-interactive" style={{
                                flex: 1,
                                padding: '12px',
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
                            <button type="submit" disabled={loading} className="button-primary" style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
                                <Save size={18} />
                                {loading ? 'Processing...' : (isEditing ? 'Commit Changes' : 'Register Asset')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default function InventoryFormPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InventoryFormContent />
        </Suspense>
    );
}
