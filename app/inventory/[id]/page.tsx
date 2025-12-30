"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Minus,
    History,
    ClipboardList,
    User,
    Calendar,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSession, signOut } from "next-auth/react";

export default function ItemDetailsPage() {
    const { id } = useParams();
    const { data: session } = useSession();
    const router = useRouter();

    const [item, setItem] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Usage Form State
    const [usageType, setUsageType] = useState<'add' | 'subtract'>('subtract');
    const [usageQty, setUsageQty] = useState<number>(0);
    const [usageReason, setUsageReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const fetchItemDetails = useCallback(async () => {
        try {
            const res = await fetch(`/api/inventory/${id}`);
            const data = await res.json();
            if (data.error) setError(data.error);
            else setItem(data);
        } catch (err) {
            setError("Failed to load asset details.");
        }
    }, [id]);

    const fetchItemHistory = useCallback(async () => {
        try {
            const res = await fetch(`/api/logs?itemId=${id}&status=all`);
            const data = await res.json();
            setHistory(data.logs || []);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await Promise.all([fetchItemDetails(), fetchItemHistory()]);
            setLoading(false);
        };

        if (id) {
            fetchAllData();
        }
    }, [id, fetchItemDetails, fetchItemHistory]);

    const handleUsageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (usageQty <= 0) return;

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    item_id: id,
                    quantity: usageQty,
                    type: usageType,
                    reason: usageReason || (usageType === 'add' ? 'RESTOCK' : 'USAGE')
                })
            });

            if (res.status === 401) {
                alert("Your session has expired or is invalid. Please log in again.");
                signOut({ callbackUrl: '/auth/signin' });
                return;
            }

            if (res.ok) {
                setSuccessMessage(usageType === 'subtract' ? "Usage request submitted for approval." : "Restock request submitted for approval.");
                setUsageQty(0);
                setUsageReason("");
                await fetchItemHistory(); // Refresh history
                setTimeout(() => setSuccessMessage(""), 5000);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to submit request.");
            }
        } catch (err) {
            setError("Something went wrong.");
        }
        setIsSubmitting(false);
    };

    if (loading) return (
        <>
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Loading asset telemetry...</div>
            </div>
        </>
    );

    if (error && !item) return (
        <>
            <Navbar />
            <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }} className="glass">
                <AlertCircle size={48} color="var(--status-error)" style={{ marginBottom: '1rem' }} />
                <h2>Error Accessing Resource</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <Link href="/inventory" className="button-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>Return to Registry</Link>
            </div>
        </>
    );

    if (!item) return null;

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <Link href="/inventory" className="action-btn" style={{ padding: '12px' }}>
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                    {item.category_id?.name || 'Uncategorized'}
                                </span>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>REF: {item?._id?.slice(-6).toUpperCase()}</span>
                            </div>
                            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <ClipboardList size={16} />
                                    <span>{item.lab_id?.name}</span>
                                </div>
                                <span>•</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Calendar size={16} />
                                    <span>Registered {new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '1.5rem', textAlign: 'right', minWidth: '200px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Stock</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: item.quantity <= (item.minStock || 0) ? 'var(--status-error)' : 'var(--accent-primary)' }}>
                                {item.quantity}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.unit}</span>
                        </div>
                        {item.quantity <= (item.minStock || 0) && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--status-error)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                <AlertCircle size={12} /> Low Stock Alert
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    {/* Activity History */}
                    <div className="glass" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <History size={20} color="var(--accent-primary)" />
                            <h3 style={{ fontSize: '1.25rem' }}>Stock Movement History</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {history.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                                    No transaction records found for this asset.
                                </div>
                            ) : (
                                history.map((log: any) => (
                                    <div key={log._id} style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: log.status === 'pending' ? 'rgba(234, 179, 8, 0.05)' : 'transparent'
                                    }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{
                                                padding: '8px',
                                                borderRadius: '50%',
                                                background: log.type === 'add' ? 'rgba(0, 255, 159, 0.1)' : 'rgba(255, 62, 0, 0.1)',
                                                color: log.type === 'add' ? 'var(--status-success)' : 'var(--status-error)'
                                            }}>
                                                {log.type === 'add' ? <Plus size={16} /> : <Minus size={16} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                                    {log.type === 'add' ? 'Restocked' : 'Subtraction'}
                                                    <span style={{ margin: '0 0.4rem', color: 'var(--text-tertiary)' }}>•</span>
                                                    {log.quantity} {item.unit}
                                                </div>
                                                {log.status === 'approved' && log.initial_quantity !== undefined && log.final_quantity !== undefined && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', lineHeight: 1.4 }}>
                                                        <span style={{ fontWeight: 600 }}>Initial:</span> {log.initial_quantity} {item.unit}
                                                        <span style={{ margin: '0 0.5rem', color: 'var(--text-tertiary)' }}>→</span>
                                                        <span style={{ fontWeight: 600, color: log.type === 'add' ? 'var(--status-success)' : 'var(--status-error)' }}>
                                                            {log.type === 'add' ? '+' : '-'}{log.quantity}
                                                        </span>
                                                        <span style={{ margin: '0 0.5rem', color: 'var(--text-tertiary)' }}>→</span>
                                                        <span style={{ fontWeight: 600 }}>Final:</span> {log.final_quantity} {item.unit}
                                                    </div>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                                    <User size={12} />
                                                    {log.user_id?.name || 'Unknown User'}
                                                    <span>•</span>
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                                {log.reason && (
                                                    <div style={{ fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, width: 'fit-content', marginTop: '0.2rem' }}>
                                                        {log.reason}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            {log.status === 'approved' && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <CheckCircle2 size={14} /> Approved
                                                </span>
                                            )}
                                            {log.status === 'rejected' && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--status-error)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <XCircle size={14} /> Rejected
                                                </span>
                                            )}
                                            {log.status === 'pending' && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--status-warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <Clock size={14} /> Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Usage Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>Record stock change</h3>

                            {successMessage && (
                                <div style={{
                                    background: '#ECFDF5',
                                    color: '#065F46',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center'
                                }}>
                                    <CheckCircle2 size={16} /> {successMessage}
                                </div>
                            )}

                            <form onSubmit={handleUsageSubmit}>
                                <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setUsageType('subtract')}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'var(--transition-fast)',
                                            background: usageType === 'subtract' ? 'var(--status-error)' : 'transparent',
                                            color: usageType === 'subtract' ? 'white' : 'var(--text-secondary)'
                                        }}
                                    >
                                        Subtract
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUsageType('add')}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'var(--transition-fast)',
                                            background: usageType === 'add' ? 'var(--status-success)' : 'transparent',
                                            color: usageType === 'add' ? 'white' : 'var(--text-secondary)'
                                        }}
                                    >
                                        Add Stock
                                    </button>
                                </div>

                                <div className="form-group">
                                    <label>Quantity ({item.unit})</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="input-base"
                                        value={usageQty || ""}
                                        onChange={(e) => setUsageQty(parseFloat(e.target.value) || 0)}
                                        placeholder="Enter amount..."
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>Reason / Note (Optional)</label>
                                    <input
                                        type="text"
                                        className="input-base"
                                        value={usageReason}
                                        onChange={(e) => setUsageReason(e.target.value)}
                                        placeholder={usageType === 'add' ? "e.g. New direct shipment" : "e.g. Daily lab prep"}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || usageQty <= 0}
                                    className="button-primary"
                                    style={{
                                        width: '100%',
                                        marginTop: '1rem',
                                        background: usageType === 'subtract' ? 'var(--status-error)' : 'var(--status-success)',
                                        opacity: (isSubmitting || usageQty <= 0) ? 0.6 : 1
                                    }}
                                >
                                    {isSubmitting ? 'Processing...' : (usageType === 'subtract' ? 'Submit Subtraction' : 'Submit Addition')}
                                </button>

                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '1rem' }}>
                                    Requests require administrator approval before stock is updated.
                                </p>
                            </form>
                        </div>

                        <div className="glass" style={{ padding: '1.5rem', background: 'rgba(79, 70, 229, 0.03)' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Asset Compliance</h4>
                            <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                                {item.expiryDate ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Expiraton Date:</span>
                                        <span style={{ fontWeight: 600 }}>{new Date(item.expiryDate).toLocaleDateString()}</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Expiration:</span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>N/A</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Threshold:</span>
                                    <span style={{ fontWeight: 600 }}>{item.minStock} {item.unit}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
