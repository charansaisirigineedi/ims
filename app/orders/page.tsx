"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    Plus
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";

export default function OrdersPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const limit = 10;

    const isAdmin = (session?.user as any)?.role === 'admin';

    useEffect(() => {
        fetchOrders();
    }, [page, filterType, filterStatus]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders?page=${page}&limit=${limit}&type=${filterType}&status=${filterStatus}`);
            const data = await res.json();
            setOrders(data.orders);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const getStatusDetails = (status: string) => {
        switch (status) {
            case 'requested': return { color: 'var(--accent-primary)', icon: <Clock size={16} />, label: 'Requested' };
            case 'pending': return { color: 'var(--status-warning)', icon: <Clock size={16} />, label: 'Approval Needed' };
            case 'completed': return { color: 'var(--status-success)', icon: <CheckCircle2 size={16} />, label: 'Completed' };
            case 'cancelled': return { color: 'var(--status-error)', icon: <XCircle size={16} />, label: 'Cancelled' };
            default: return { color: 'var(--text-secondary)', icon: null, label: status };
        }
    };

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Transactions</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Track and manage all batch procurement and audit sessions.</p>
                    </div>
                    {isAdmin && (
                        <Link href="/orders/new" className="button-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                            <Plus size={18} /> New Purchase Request
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type</span>
                        <select
                            className="input-base"
                            style={{ width: '160px', padding: '8px' }}
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                        >
                            <option value="all">All Transactions</option>
                            <option value="purchase">Purchase Orders</option>
                            <option value="audit">Inventory Audits</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</span>
                        <select
                            className="input-base"
                            style={{ width: '160px', padding: '8px' }}
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="requested">Requested</option>
                            <option value="pending">Pending Approval</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="glass overflow-hidden">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--bg-subtle)' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Label & ID</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Initiated By</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Items</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ textAlign: 'right', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem' }}>
                                        <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Syncing transaction history...</div>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>No transactions found for the selected filters.</td>
                                </tr>
                            ) : orders.map((order) => {
                                const details = getStatusDetails(order.status);
                                return (
                                    <tr key={order._id} className="table-row">
                                        <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    background: order.type === 'purchase' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                    color: order.type === 'purchase' ? 'var(--accent-primary)' : 'var(--status-success)'
                                                }}>
                                                    {order.type === 'purchase' ? <ShoppingBag size={20} /> : <ClipboardList size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {order.type === 'purchase' ? 'Purchase Request' : 'Inventory Audit'}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>#{order._id.slice(-8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.user_id?.name || 'Unknown User'}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.user_id?.email || 'No email associated'}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{order.items.length} Assets</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                {order.items.map((i: any) => i.item_id?.name).join(", ")}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem', verticalAlign: 'top' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                color: details.color,
                                                background: `${details.color}15`,
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                width: 'fit-content',
                                                border: `1px solid ${details.color}30`
                                            }}>
                                                {details.icon}
                                                {details.label}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem', textAlign: 'right', verticalAlign: 'top' }}>
                                            <Link href={`/orders/${order._id}`} className="action-btn" style={{ textDecoration: 'none' }}>
                                                <Eye size={18} />
                                                <span>Manage</span>
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="action-btn"
                                style={{ opacity: page === 1 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Page {page} of {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="action-btn"
                                style={{ opacity: page === totalPages ? 0.3 : 1 }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
