"use client";

import { useState, useEffect } from "react";
import {
    ClipboardCheck,
    Filter,
    Search,
    Save,
    AlertCircle,
    CheckCircle2,
    Minus,
    Plus,
    X,
    ShoppingCart,
    Scan
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function StockTakePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const isAdmin = (session?.user as any)?.role === 'admin';

    // Selection state
    const [auditBucket, setAuditBucket] = useState<any[]>([]);

    // Search states
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Metadata for filtering search
    const [labs, setLabs] = useState<any[]>([]);
    const [filterLab, setFilterLab] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Audit State: stores the input value for each item ID
    const [counts, setCounts] = useState<{ [key: string]: string }>({});
    const [reportingMode, setReportingMode] = useState<'audit' | 'utilisation'>('utilisation');

    useEffect(() => {
        if (!isAdmin && reportingMode === 'audit') {
            setReportingMode('utilisation');
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    const [searchPage, setSearchPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Search effect
    useEffect(() => {
        const performSearch = async () => {
            if (!searchTerm.trim() && !filterLab) {
                setSearchResults([]);
                setSearchPage(1);
                setHasMore(false);
                return;
            }
            setIsSearching(true);
            try {
                const res = await fetch(`/api/inventory?labId=${filterLab}&search=${searchTerm}&page=${searchPage}&limit=10`);
                const data = await res.json();

                if (searchPage === 1) {
                    setSearchResults(data.items);
                } else {
                    setSearchResults(prev => [...prev, ...data.items]);
                }
                setHasMore(data.currentPage < data.pages);
            } catch (err) {
                console.error(err);
            }
            setIsSearching(false);
        };

        const delay = setTimeout(performSearch, 300);
        return () => clearTimeout(delay);
    }, [searchTerm, filterLab, searchPage]);

    // Reset search pagination when query changes
    useEffect(() => {
        setSearchPage(1);
    }, [searchTerm, filterLab]);

    const fetchMetadata = async () => {
        try {
            const res = await fetch("/api/labs");
            setLabs(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    const addToAudit = (item: any) => {
        setAuditBucket(prev => [...prev, item]);
    };

    const removeFromAudit = (id: string) => {
        setAuditBucket(prev => prev.filter(i => i._id !== id));
        const newCounts = { ...counts };
        delete newCounts[id];
        setCounts(newCounts);
    };

    const handleCountChange = (id: string, value: string) => {
        setCounts(prev => ({ ...prev, [id]: value }));
    };

    const calculateDelta = (item: any) => {
        const val = parseFloat(counts[item._id]);
        if (isNaN(val)) return null;

        if (reportingMode === 'audit') {
            return val - item.quantity;
        } else {
            // In utilisation mode, the input IS the amount used (negative change)
            return -val;
        }
    };

    const handleSubmitAudit = async () => {
        const adjustments = auditBucket
            .map(item => {
                const delta = calculateDelta(item);
                if (delta === null || delta === 0) return null;

                return {
                    item_id: item._id,
                    quantity: Math.abs(delta),
                    type: delta > 0 ? 'add' : 'subtract',
                    reason: reportingMode === 'audit' ? 'PHYSICAL_AUDIT' : 'UTILISATION_LOG'
                };
            })
            .filter(Boolean);

        if (adjustments.length === 0) {
            setError("No physical audit changes detected in the selected bucket.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const auditPayload = {
                type: 'audit',
                reason: reportingMode === 'audit' ? 'PHYSICAL_AUDIT_SESSION' : 'UTILISATION_BATCH',
                items: adjustments.filter((a): a is any => a !== null).map(a => ({
                    item_id: a.item_id,
                    requested_qty: a.quantity, // In audit mode, requested_qty serves as the reported value
                    current_stock: auditBucket.find(i => i._id === a.item_id)?.quantity || 0
                }))
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(auditPayload)
            });

            if (res.ok) {
                const order = await res.json();
                setSuccess(true);
                setAuditBucket([]);
                setCounts({});
                setTimeout(() => {
                    setSuccess(false);
                    router.push(`/orders/${order._id}`);
                }, 1500);
            } else {
                if (res.status === 401) {
                    alert("Your session has expired or is invalid. Please log in again.");
                    signOut({ callbackUrl: '/auth/signin' });
                    return;
                }
                const data = await res.json();
                setError(data.error || "Failed to submit audit report.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        }
        setIsSubmitting(false);
    };

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <div style={{ background: 'var(--accent-light)', padding: '10px', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                                <Scan size={24} />
                            </div>
                            <h1 style={{ fontSize: '2.5rem' }}>{isAdmin ? 'Focused Stock Take' : 'Utilisation Reporting'}</h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                            {isAdmin
                                ? 'Select specific items to audit from your laboratory inventory.'
                                : 'Select items to record laboratory usage and consumption.'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {isAdmin && (
                            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginRight: '1rem' }}>
                                <button
                                    onClick={() => setReportingMode('utilisation')}
                                    className={reportingMode === 'utilisation' ? 'button-primary' : 'glass-interactive'}
                                    style={{ padding: '8px 16px', fontSize: '0.85rem', height: 'auto', border: reportingMode === 'utilisation' ? 'none' : '1px solid transparent' }}
                                >
                                    <Minus size={14} style={{ marginRight: '6px' }} /> Report Utilisation
                                </button>
                                <button
                                    onClick={() => setReportingMode('audit')}
                                    className={reportingMode === 'audit' ? 'button-primary' : 'glass-interactive'}
                                    style={{ padding: '8px 16px', fontSize: '0.85rem', height: 'auto', border: reportingMode === 'audit' ? 'none' : '1px solid transparent' }}
                                >
                                    <Scan size={14} style={{ marginRight: '6px' }} /> Physical Audit
                                </button>
                            </div>
                        )}
                        <button
                            disabled={isSubmitting || auditBucket.length === 0}
                            onClick={handleSubmitAudit}
                            className="button-primary"
                            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                        >
                            {isSubmitting ? 'Processing...' : (reportingMode === 'utilisation' ? 'Submit Usage Log' : 'Update Inventory')}
                            <Save size={18} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem' }}>
                    {/* Item Finder */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="glass" style={{ padding: '1.5rem', position: 'sticky', top: '7rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Search size={18} /> Asset Finder
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <select className="input-base" value={filterLab} onChange={e => setFilterLab(e.target.value)}>
                                    <option value="">Current Lab: All Locations</option>
                                    {labs.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                </select>

                                <input
                                    type="text"
                                    placeholder="Search by name or REF..."
                                    className="input-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {isSearching ? (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Scanning nodes...</div>
                                ) : searchResults.length === 0 ? (
                                    searchTerm ? <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No assets found</div> : null
                                ) : (
                                    searchResults
                                        .filter(item => !auditBucket.find(b => b._id === item._id))
                                        .map(item => (
                                            <button
                                                key={item._id}
                                                onClick={() => addToAudit(item)}
                                                className="glass-interactive"
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1px solid var(--border-subtle)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>REF: {item._id.slice(-6).toUpperCase()}</div>
                                                </div>
                                                <Plus size={14} color="var(--accent-primary)" />
                                            </button>
                                        ))
                                )}

                                {hasMore && !isSearching && (
                                    <button
                                        onClick={() => setSearchPage(p => p + 1)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--accent-primary)',
                                            background: 'transparent',
                                            border: '1px dashed var(--accent-primary)',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            marginTop: '0.5rem'
                                        }}
                                    >
                                        Load More Results
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Audit Bucket */}
                    <div>
                        {error && (
                            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <AlertCircle size={18} />
                                <span style={{ fontSize: '0.875rem' }}>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div style={{ background: '#ECFDF5', border: '1px solid #D1FAE5', color: '#065F46', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <CheckCircle2 size={18} />
                                <span style={{ fontSize: '0.875rem' }}>Multi-item audit submitted successfully. Redirecting...</span>
                            </div>
                        )}

                        <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <ShoppingCart size={18} color="var(--accent-primary)" /> Audit Bucket
                                </h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                    {auditBucket.length} ITEMS SELECTED
                                </span>
                            </div>

                            <table className="data-table" style={{ border: 'none' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
                                    <tr>
                                        <th style={{ paddingLeft: '1.5rem' }}>Asset</th>
                                        <th>Current Stock</th>
                                        <th>{reportingMode === 'utilisation' ? 'Quantity Used' : 'Physical Count'}</th>
                                        <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditBucket.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-tertiary)' }}>
                                                <div style={{ marginBottom: '1rem' }}><ClipboardCheck size={48} opacity={0.2} style={{ margin: '0 auto' }} /></div>
                                                <p style={{ fontSize: '0.9rem' }}>Use the finder on the left to add items to your audit.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        auditBucket.map(item => {
                                            const delta = calculateDelta(item);
                                            return (
                                                <tr key={item._id}>
                                                    <td style={{ paddingLeft: '1.5rem' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{item.lab_id?.name} • {item.unit}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{item.quantity} {item.unit}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <input
                                                                type="number"
                                                                className="input-base"
                                                                style={{ width: '100px', padding: '8px' }}
                                                                value={counts[item._id] || ""}
                                                                onChange={(e) => handleCountChange(item._id, e.target.value)}
                                                                placeholder={reportingMode === 'utilisation' ? "Used..." : "Count..."}
                                                            />
                                                            {delta !== null && delta !== 0 && (
                                                                <div style={{
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 800,
                                                                    color: delta > 0 ? 'var(--status-success)' : 'var(--status-error)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '2px'
                                                                }}>
                                                                    {delta > 0 ? <Plus size={10} /> : <Minus size={10} />}
                                                                    {Math.abs(delta)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                                                        <button
                                                            onClick={() => removeFromAudit(item._id)}
                                                            className="action-btn"
                                                            style={{ color: 'var(--status-error)', borderColor: 'var(--border-subtle)' }}
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
