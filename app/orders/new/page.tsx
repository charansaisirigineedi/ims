"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag,
    Trash2,
    Plus,
    ArrowLeft,
    Save,
    AlertCircle,
    CheckCircle2,
    Database
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useSession, signOut } from "next-auth/react";

export default function NewOrderPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [reason, setReason] = useState("");

    // Search for new items to add
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchLowStock();
    }, []);

    const fetchLowStock = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/inventory/reorder");
            const data = await res.json();
            setItems(data.map((i: any) => ({
                item_id: i, // The whole object
                requested_qty: Math.max(0, (i.minStock * 2) - i.quantity)
            })));
        } catch (err) {
            console.error(err);
            setError("Failed to load suggested reorder items.");
        }
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/inventory?search=${searchTerm}&limit=5`);
            const data = await res.json();
            setSearchResults(data.items);
        } catch (err) {
            console.error(err);
        }
        setIsSearching(false);
    };

    const addItem = (item: any) => {
        if (items.find(i => i.item_id._id === item._id)) return;
        setItems([...items, { item_id: item, requested_qty: item.minStock || 10 }]);
        setSearchTerm("");
        setSearchResults([]);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.item_id._id !== id));
    };

    const updateQty = (id: string, qty: number) => {
        setItems(items.map(i => i.item_id._id === id ? { ...i, requested_qty: qty } : i));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;

        setIsSubmitting(true);
        setError("");

        try {
            const orderPayload = {
                type: 'purchase',
                reason: reason || "Standard Replenishment",
                items: items.map(i => ({
                    item_id: i.item_id._id,
                    requested_qty: i.requested_qty,
                    current_stock: i.item_id.quantity
                }))
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload)
            });

            if (res.ok) {
                const order = await res.json();
                router.push(`/orders/${order._id}`);
            } else {
                if (res.status === 401) {
                    alert("Your session has expired or is invalid. Please log in again.");
                    signOut({ callbackUrl: '/auth/signin' });
                    return;
                }
                const data = await res.json();
                setError(data.error || "Failed to create purchase request.");
            }
        } catch (err) {
            setError("Failed to connect to procurement server.");
        }
        setIsSubmitting(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-body)' }}>
            <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Analyzing Stock Telemetry...</div>
        </div>
    );

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ marginBottom: '2.5rem' }}>
                    <Link href="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
                        <ArrowLeft size={16} /> Back to Registry
                    </Link>
                    <h1 style={{ fontSize: '2.5rem' }}>New Purchase Request</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Configure a procurement batch for supplier submission.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <ShoppingBag size={20} color="var(--accent-primary)" /> Order Item List
                                </h3>
                                <span className="badge badge-success">{items.length} Items Selected</span>
                            </div>

                            {items.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem', border: '2px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}>
                                    No assets in this request. Use the search bar to add items.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {items.map((entry) => (
                                        <div key={entry.item_id._id} className="table-row" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 150px 50px', alignItems: 'center', gap: '1.5rem' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{entry.item_id.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>On Hand: {entry.item_id.quantity} {entry.item_id.unit}</div>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="number"
                                                    className="input-base"
                                                    style={{ width: '100%', padding: '8px 12px' }}
                                                    value={entry.requested_qty}
                                                    onChange={(e) => updateQty(entry.item_id._id, parseFloat(e.target.value) || 0)}
                                                    required
                                                />
                                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
                                                    {entry.item_id.unit}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(entry.item_id._id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--status-error)', cursor: 'pointer', opacity: 0.7, padding: '5px' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Order Context</h3>
                            <div className="form-group">
                                <label>Justification / Notes</label>
                                <textarea
                                    className="input-base"
                                    style={{ width: '100%', minHeight: '100px', padding: '1rem', resize: 'vertical' }}
                                    placeholder="e.g. Monthly buffer restock or specific project procurement..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                            </div>
                        </div>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Quick Add</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="text"
                                    className="input-base"
                                    placeholder="Search asset..."
                                    style={{ flex: 1, padding: '8px 12px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button type="button" onClick={handleSearch} className="button-primary" style={{ padding: '8px' }}>
                                    <Plus size={20} />
                                </button>
                            </div>

                            {isSearching && <div className="animate-pulse" style={{ fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>Searching assets...</div>}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {searchResults.map((res) => (
                                    <button
                                        type="button"
                                        key={res._id}
                                        onClick={() => addItem(res)}
                                        className="glass glass-interactive"
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span>{res.name}</span>
                                        <Plus size={14} color="var(--accent-primary)" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '2rem', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid var(--accent-light)' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Summary</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Total Line Items:</span>
                                    <span style={{ fontWeight: 700 }}>{items.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Procurement Mode:</span>
                                    <span style={{ color: 'var(--status-success)', fontWeight: 800, fontSize: '0.75rem' }}>BATCH AUTO-FILL</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || items.length === 0}
                                className="button-primary"
                                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', opacity: (isSubmitting || items.length === 0) ? 0.6 : 1 }}
                            >
                                <Save size={18} />
                                {isSubmitting ? 'Recording Request...' : 'Initialize Order'}
                            </button>

                            {error && (
                                <div style={{ marginTop: '1rem', color: 'var(--status-error)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={14} /> {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    margin-bottom: 0.75rem;
                }
            `}</style>
        </>
    );
}
