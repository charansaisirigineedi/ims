"use client";

import { useState, useEffect } from "react";
import {
    ShoppingBag,
    ClipboardList,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Download,
    Package,
    AlertTriangle,
    Clock,
    User,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function OrderDetailsPage() {
    const { id } = useParams();
    const { data: session } = useSession();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fulfillment state: tracks what's actually being received/confirmed
    const [receivedQtys, setReceivedQtys] = useState<{ [key: string]: number }>({});
    const isAdmin = (session?.user as any)?.role === 'admin';

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/orders/${id}`);
            const data = await res.json();
            setOrder(data);

            // Initialise received quantities with requested quantities
            const initialQtys: { [key: string]: number } = {};
            data.items.forEach((i: any) => {
                initialQtys[i.item_id._id] = i.received_qty || i.requested_qty;
            });
            setReceivedQtys(initialQtys);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleFinalize = async (status: 'completed' | 'cancelled') => {
        if (!confirm(`Are you sure you want to ${status === 'completed' ? 'finalise' : 'cancel'} this transaction?`)) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    items: Object.entries(receivedQtys).map(([itemId, qty]) => ({
                        item_id: itemId,
                        received_qty: qty
                    }))
                })
            });

            if (res.ok) {
                fetchOrder();
            } else {
                alert("Failed to update transaction status.");
            }
        } catch (err) {
            console.error(err);
        }
        setIsSubmitting(false);
    };

    const exportToCSV = () => {
        const csvData = order.items.map((i: any) => ({
            'Asset Name': i.item_id?.name,
            'Requested': i.requested_qty,
            'Received/Confirmed': receivedQtys[i.item_id?._id],
            'Unit': i.item_id?.unit,
            'Current Stock (at time)': i.current_stock
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${order.type}_batch_${order._id.slice(-8)}.csv`;
        link.click();
    };

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF() as any;
            const margin = 20;
            const pageWidth = doc.internal.pageSize.width;

            // Header
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("PURCHASE REQUEST ORDER", margin, 30);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            doc.text("LABORATORY PROCUREMENT DOCUMENT", margin, 36);

            // Lab Address (Right side)
            doc.setTextColor(0);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("ACT Science Center", pageWidth - margin, 30, { align: "right" });
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text("Palakollu", pageWidth - margin, 35, { align: "right" });

            doc.line(margin, 45, pageWidth - margin, 45);

            // Order Info
            const infoStartY = 55;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("ORDER DETAILS:", margin, infoStartY);
            doc.setFont("helvetica", "normal");
            doc.text(`PO Number: ${order._id.slice(-8).toUpperCase()}`, margin, infoStartY + 6);
            doc.text(`Date Issued: ${new Date(order.createdAt).toLocaleDateString()}`, margin, infoStartY + 11);

            // Table - Only Item Name, Lab, Qty
            const tableStartY = 75;
            const tableBody = (order.items || []).map((item: any) => [
                item.item_id ? item.item_id.name : 'Unknown Item',
                item.item_id?.lab_id?.name || 'N/A',
                `${item.requested_qty || 0} ${item.item_id ? item.item_id.unit : 'Units'}`
            ]);

            // Use autoTable directly (v5.0+ requires passing doc as first parameter)
            autoTable(doc, {
                startY: tableStartY,
                head: [['Item Name', 'Lab', 'Qty']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [30, 30, 30], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 5 },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 40, halign: 'right' }
                }
            });

            doc.save(`PO_${order._id.slice(-8)}.pdf`);
        } catch (err: any) {
            console.error("PDF Generation Error:", err);
            alert(`Failed to generate PDF: ${err.message}`);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-body)' }}>
            <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Syncing Transaction Data...</div>
        </div>
    );

    if (!order) return null;

    const isComplete = order.status === 'completed';
    const isCancelled = order.status === 'cancelled';

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ marginBottom: '3rem' }}>
                    <Link href="/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
                        <ArrowLeft size={16} /> Transactions Registry
                    </Link>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span className={`badge ${isComplete ? 'badge-success' : isCancelled ? 'badge-error' : 'badge-warning'}`}>
                                    {order.type.toUpperCase()} • {order.status.toUpperCase()}
                                </span>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Transaction ID: {order._id}</span>
                            </div>
                            <h1 style={{ fontSize: '2.5rem' }}>{order.type === 'purchase' ? 'Procurement Batch' : 'Inventory Audit Report'}</h1>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {order.type === 'purchase' && (
                                <button onClick={handleDownloadPDF} className="glass glass-interactive" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Download size={18} /> Download PO PDF
                                </button>
                            )}
                            <button onClick={exportToCSV} className="action-btn" style={{ padding: '10px 20px' }}>
                                <Download size={18} /> Export as CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                    <div className="glass overflow-hidden" style={{ minHeight: '400px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-subtle)' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ASSET NAME</th>
                                    <th style={{ textAlign: 'center', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>REQUESTED</th>
                                    <th style={{ textAlign: 'center', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>RECEIVED / FINAL</th>
                                    <th style={{ textAlign: 'center', padding: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>DISCREPANCY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((entry: any) => {
                                    const requested = entry.requested_qty;
                                    const current = receivedQtys[entry.item_id?._id] || 0;
                                    const diff = current - requested;

                                    return (
                                        <tr key={entry._id} className="table-row">
                                            <td style={{ padding: '1.25rem' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.item_id?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Reference Node: {entry.item_id?._id}</div>
                                            </td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{requested}</span> {entry.item_id?.unit}
                                            </td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                                {(isComplete || isCancelled || !isAdmin) ? (
                                                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)' }}>{current}</span>
                                                ) : (
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <input
                                                            type="number"
                                                            className="input-base"
                                                            style={{ width: '90px', padding: '6px 10px', textAlign: 'center' }}
                                                            value={current}
                                                            onChange={(e) => setReceivedQtys({ ...receivedQtys, [entry.item_id?._id]: parseFloat(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                )}
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '5px' }}>{entry.item_id?.unit}</span>
                                            </td>
                                            <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                                {diff === 0 ? (
                                                    <span style={{ color: 'var(--status-success)', fontWeight: 800, fontSize: '0.75rem' }}>MATCH</span>
                                                ) : (
                                                    <span style={{ color: diff > 0 ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 800, fontSize: '0.75rem' }}>
                                                        {diff > 0 ? `+${diff}` : diff} {entry.item_id?.unit}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="glass" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Lifecycle Metadata</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '8px', background: 'var(--accent-light)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                                        <User size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Initiated By</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.user_id?.name || 'Unknown / Deleted User'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '8px', background: 'var(--accent-light)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Raised On</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>
                                {order.reason && (
                                    <div className="glass" style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Original Context</div>
                                        <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{order.reason}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {(!isComplete && !isCancelled && isAdmin) && (
                            <div className="glass" style={{ padding: '2rem', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid var(--accent-light)' }}>
                                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Administrative Control</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => handleFinalize('completed')}
                                        className="button-primary"
                                        style={{ width: '100%', padding: '12px', background: 'var(--status-success)', borderColor: 'var(--status-success)' }}
                                    >
                                        <CheckCircle2 size={18} style={{ marginRight: '8px' }} />
                                        {order.type === 'purchase' ? 'Finalise Receipt' : 'Approve Audit Batch'}
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => handleFinalize('cancelled')}
                                        className="glass glass-interactive"
                                        style={{ width: '100%', padding: '12px', color: 'var(--status-error)', borderColor: 'var(--status-error)' }}
                                    >
                                        <XCircle size={18} style={{ marginRight: '8px' }} />
                                        Void Transaction
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.4 }}>
                                    Finalizing will atomically update inventory levels and close the transaction window.
                                </p>
                            </div>
                        )}

                        {isComplete && (
                            <div className="glass" style={{ padding: '2rem', border: '1px solid var(--status-success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--status-success)', marginBottom: '1rem' }}>
                                    <CheckCircle2 size={24} />
                                    <h3 style={{ fontSize: '1.1rem' }}>Successfully Archived</h3>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    <div>Finalised By: <strong>{order.completed_by?.name || 'Legacy Account'}</strong></div>
                                    <div>Executed On: <strong>{new Date(order.completed_at).toLocaleString()}</strong></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
