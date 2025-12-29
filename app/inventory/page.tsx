"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Download as DownloadIcon, Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Papa from "papaparse";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useSession } from "next-auth/react";

export default function InventoryPage() {
    const { data: session } = useSession();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterLab, setFilterLab] = useState("");
    const [labs, setLabs] = useState<any[]>([]);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    const isAdmin = (session?.user as any)?.role === 'admin';

    useEffect(() => {
        fetchLabs();
        fetchData();
    }, []);

    const fetchLabs = async () => {
        try {
            const res = await fetch("/api/labs");
            const data = await res.json();
            setLabs(data.map((l: any) => ({ id: l._id, name: l.name })));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/inventory?page=${page}&limit=${limit}&search=${searchTerm}&labId=${filterLab}`);
            const data = await res.json();
            setItems(data.items);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        const delay = setTimeout(fetchData, 300);
        return () => clearTimeout(delay);
    }, [searchTerm, filterLab, page]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterLab]);

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this entry from inventory?")) return;
        try {
            const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const exportCSV = () => {
        // Note: For large systems, CSV export should typically be handled by a specific bulk API
        // For now, we export the current page
        const csvData = items.map(i => ({
            Name: i.name,
            Lab: i.lab_id?.name,
            Category: i.category_id?.name,
            Quantity: i.quantity,
            Unit: i.unit,
            MinStock: i.minStock,
            Status: i.status
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportPDF = () => {
        const doc = new jsPDF() as any;
        doc.text("Laboratory Inventory Report", 14, 15);
        const tableData = items.map(i => [
            i.name, i.lab_id?.name, i.category_id?.name, i.quantity, i.unit, i.status
        ]);
        doc.autoTable({
            head: [['Name', 'Lab', 'Category', 'Qty', 'Unit', 'Status']],
            body: tableData,
            startY: 20,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] } // Indigo 600
        });
        doc.save(`inventory_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Inventory Registry</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Centralized registry for all laboratory equipment and consumables.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={exportCSV} className="glass glass-interactive" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', width: 'auto' }}>
                            <DownloadIcon size={16} /> CSV
                        </button>
                        <button onClick={exportPDF} className="glass glass-interactive" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', width: 'auto' }}>
                            <DownloadIcon size={16} /> PDF
                        </button>
                        {isAdmin && (
                            <Link href="/inventory/form" className="button-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none' }}>
                                <Plus size={18} /> Add Entry
                            </Link>
                        )}
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-card)' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Identify assets by name or ID..."
                            className="input-base"
                            style={{ paddingLeft: '44px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginLeft: 'auto' }}>
                        <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
                        <select
                            className="input-base"
                            style={{ width: '200px', fontSize: '0.9rem', padding: '10px' }}
                            value={filterLab}
                            onChange={(e) => setFilterLab(e.target.value)}
                        >
                            <option value="">All Laboratories</option>
                            {labs.map(lab => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Asset Detail</th>
                                <th>Laboratory</th>
                                <th>Category</th>
                                <th>Stock Level</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600 }}>Refreshing node states...</div>
                                </td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    No assets detected in the current scope.
                                </td></tr>
                            ) : items.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>REF: {item._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', opacity: 0.6 }}></div>
                                            {item.lab_id?.name}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.category_id?.name || 'Uncategorized'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                            <span style={{
                                                color: item.quantity <= (item.minStock || 0) ? 'var(--status-error)' : 'var(--text-primary)',
                                                fontWeight: 700,
                                            }}>
                                                {item.quantity}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.unit}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${item.quantity <= (item.minStock || 0) ? 'badge-error' : 'badge-success'}`}>
                                            {item.quantity <= (item.minStock || 0) ? 'Critical' : 'Stable'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Link href={`/inventory/${item._id}`} className="action-btn" title="Inspect Asset">
                                                <Eye size={14} />
                                            </Link>
                                            {isAdmin && (
                                                <>
                                                    <Link href={`/inventory/form?id=${item._id}`} className="action-btn" title="Edit Metadata">
                                                        <Edit2 size={14} />
                                                    </Link>
                                                    <button onClick={() => handleDelete(item._id)} className="action-btn" title="Delete Permanent" style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div style={{
                    marginTop: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Showing <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(page - 1) * limit + 1}</span> to <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{Math.min(page * limit, totalItems)}</span> of <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{totalItems}</span> assets
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="glass glass-interactive"
                            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: page === 1 ? 0.5 : 1 }}
                        >
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 1rem' }}>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Simple sliding window for page numbers
                                let pageNum = page;
                                if (page <= 3) pageNum = i + 1;
                                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = page - 2 + i;

                                if (pageNum > 0 && pageNum <= totalPages) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-subtle)',
                                                background: page === pageNum ? 'var(--accent-primary)' : 'transparent',
                                                color: page === pageNum ? 'white' : 'var(--text-secondary)',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        <button
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="glass glass-interactive"
                            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: page === totalPages ? 0.5 : 1 }}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
