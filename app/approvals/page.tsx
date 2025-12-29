"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, User, Package, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ApprovalsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isAdmin = (session?.user as any)?.role === 'admin';

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [adjustedQuantities, setAdjustedQuantities] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
            router.push('/dashboard');
        }
    }, [status, isAdmin]);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 20;

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/logs?status=pending&page=${page}&limit=${limit}`);
            const data = await res.json();
            setLogs(data.logs);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleAction = async (logId: string, status: 'approved' | 'rejected') => {
        if (actionLoading) return;
        setActionLoading(logId);
        const quantity = adjustedQuantities[logId] !== undefined ? parseFloat(adjustedQuantities[logId]) : undefined;
        try {
            const res = await fetch("/api/logs", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logId, status, quantity })
            });
            if (res.status === 401) {
                alert("Your session has expired or is invalid. Please log in again.");
                signOut({ callbackUrl: '/auth/signin' });
                return;
            }
            if (res.ok) {
                // If it was the last item on the page, go back a page if possible
                if (logs.length === 1 && page > 1) {
                    setPage(p => p - 1);
                } else {
                    fetchLogs();
                }
            }
        } catch (err) {
            console.error(err);
        }
        setActionLoading(null);
    };

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'var(--accent-light)', padding: '10px', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                            <Clock size={24} />
                        </div>
                        <h1 style={{ fontSize: '2.5rem' }}>Pending Approvals</h1>
                    </div>
                    {totalItems > 0 && (
                        <span className="badge badge-success" style={{ padding: '8px 16px' }}>
                            {totalItems} Requests Awaiting
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '5rem' }}>
                            <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Syncing usage logs...</div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="glass" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <CheckCircle size={48} color="var(--status-success)" style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
                            <h3>Clear Queue</h3>
                            <p>All laboratory transaction logs have been processed.</p>
                        </div>
                    ) : (
                        <>
                            {logs.map((log) => (
                                <div key={log._id} className="glass animate-fade-in" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', gap: '3rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800 }}>
                                                <User size={14} /> {log.user_id?.name || 'Unknown User'}
                                            </div>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {log.type === 'subtract' ? (
                                                    <span style={{ color: 'var(--status-error)' }}>Stock Subtraction</span>
                                                ) : (
                                                    <span style={{ color: 'var(--status-success)' }}>Restock Addition</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                Raised {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                <Package size={14} /> ASSET REFERENCE
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.item_id?.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <input
                                                    type="number"
                                                    className="input-base"
                                                    style={{ width: '80px', padding: '4px 8px', fontSize: '0.9rem' }}
                                                    defaultValue={log.quantity}
                                                    onChange={(e) => setAdjustedQuantities({ ...adjustedQuantities, [log._id]: e.target.value })}
                                                />
                                                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                                    {log.item_id?.unit}
                                                </span>
                                            </div>
                                            {log.reason && (
                                                <div style={{ fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, width: 'fit-content' }}>
                                                    {log.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '5px' }}>
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction(log._id, 'rejected')}
                                            className="glass glass-interactive"
                                            style={{
                                                padding: '10px 20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                color: 'var(--status-error)',
                                                borderColor: 'var(--border-subtle)',
                                                opacity: actionLoading === log._id ? 0.5 : 1
                                            }}
                                        >
                                            <XCircle size={18} />
                                            {actionLoading === log._id ? '...' : 'Reject'}
                                        </button>
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction(log._id, 'approved')}
                                            className="button-primary"
                                            style={{
                                                padding: '10px 24px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'var(--status-success)',
                                                borderColor: 'var(--status-success)',
                                                opacity: actionLoading === log._id ? 0.5 : 1
                                            }}
                                        >
                                            <CheckCircle size={18} />
                                            {actionLoading === log._id ? 'Processing' : 'Approve'}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '1.5rem',
                                    marginTop: '2rem'
                                }}>
                                    <button
                                        disabled={page === 1 || loading}
                                        onClick={() => setPage(p => p - 1)}
                                        className="action-btn"
                                        style={{ opacity: page === 1 ? 0.3 : 1 }}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        disabled={page === totalPages || loading}
                                        onClick={() => setPage(p => p + 1)}
                                        className="action-btn"
                                        style={{ opacity: page === totalPages ? 0.3 : 1 }}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
