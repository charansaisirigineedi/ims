"use client";

import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { Database, AlertTriangle, Clock, TrendingUp, Scan, Plus, Package, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Papa from "papaparse";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function DashboardPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = (session?.user as any)?.role === 'admin';

    useEffect(() => {
        fetch("/api/stats")
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const handleExport = async () => {
        // Fetch all inventory for export since dashboard stats only has counts
        try {
            const res = await fetch("/api/inventory?limit=1000"); // Fetch a large chunk for reporting
            const data = await res.json();
            const csvData = data.items.map((i: any) => ({
                Name: i.name,
                Lab: i.lab_id?.name,
                Category: i.category_id?.name,
                Quantity: i.quantity,
                Unit: i.unit,
                MinStock: i.minStock,
                Status: i.quantity <= (i.minStock || 0) ? 'CRITICAL' : 'STABLE'
            }));
            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `laboratory_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    const [submittingPO, setSubmittingPO] = useState(false);

    const handleCommitPO = async () => {
        try {
            setSubmittingPO(true);
            const res = await fetch("/api/inventory/reorder");
            const items = await res.json();

            if (items.length === 0) {
                alert("No items currently require reordering.");
                setSubmittingPO(false);
                return;
            }

            const adjustments = items.map((i: any) => ({
                item_id: i._id,
                quantity: Math.max(0, (i.minStock * 2) - i.quantity),
                type: 'add',
                reason: 'PURCHASE'
            }));

            const postRes = await fetch("/api/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(adjustments)
            });

            if (postRes.ok) {
                alert("Procurement requests committed to approvals queue.");
            } else {
                alert("Failed to commit procurement requests.");
            }
        } catch (err) {
            console.error("Order commitment failed", err);
        }
        setSubmittingPO(false);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-body)' }}>
            <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: 600 }}>Syncing Dashboard Telemery...</div>
        </div>
    );

    const pieData = {
        labels: stats.labBreakdown.map((l: any) => l.name),
        datasets: [{
            data: stats.labBreakdown.map((l: any) => l.count),
            backgroundColor: [
                'rgba(79, 70, 229, 0.8)',  // Indigo
                'rgba(59, 130, 246, 0.8)',  // Blue
                'rgba(16, 185, 129, 0.8)',  // Emerald
                'rgba(245, 158, 11, 0.8)',  // Amber
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
        }],
    };

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Command Center</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
                        Real-time telemetry and resource allocation metrics for laboratory operations.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="glass stat-card">
                        <div className="stat-label">Total Node Assets</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: 'auto' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                                <Database size={24} />
                            </div>
                            <div className="stat-value">{stats.totalItems}</div>
                        </div>
                    </div>
                    <div className="glass stat-card">
                        <div className="stat-label">Low Stock Alerts</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: 'auto' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: '#FEF3C7', color: 'var(--status-warning)' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className="stat-value" style={{ color: 'var(--status-warning)' }}>{stats.lowStockItems}</div>
                        </div>
                    </div>
                    <div className="glass stat-card">
                        <div className="stat-label">Critical Expirations</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: 'auto' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: '#FEE2E2', color: 'var(--status-error)' }}>
                                <Clock size={24} />
                            </div>
                            <div className="stat-value" style={{ color: 'var(--status-error)' }}>{stats.expiringSoon}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                    <div className="glass" style={{ padding: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Allocation Distribution</h3>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--status-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                LIVE TELEMETRY
                            </div>
                        </div>
                        <div style={{ height: '320px', display: 'flex', justifyContent: 'center' }}>
                            <Pie data={pieData} options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: {
                                            color: 'var(--text-secondary)',
                                            padding: 25,
                                            usePointStyle: true,
                                            font: { size: 12, weight: 600, family: 'Inter' }
                                        }
                                    }
                                }
                            }} />
                        </div>
                    </div>

                    <div className="glass" style={{ padding: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Quick Dispatch</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                            <Link href="/stock-take" style={{ textDecoration: 'none' }}>
                                <div className="glass glass-interactive" style={{
                                    padding: '1.25rem',
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    gap: '1.25rem',
                                    alignItems: 'center',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div style={{ color: 'var(--accent-primary)', background: 'var(--accent-light)', padding: '12px', borderRadius: '12px' }}>
                                        <Scan size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>Perform Stock Take</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log daily utilisation or physical audits</div>
                                    </div>
                                </div>
                            </Link>

                            {isAdmin && (
                                <Link href="/inventory/form" style={{ textDecoration: 'none' }}>
                                    <div className="glass glass-interactive" style={{
                                        padding: '1.25rem',
                                        border: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        gap: '1.25rem',
                                        alignItems: 'center',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <div style={{ color: 'var(--accent-primary)', background: 'var(--accent-light)', padding: '12px', borderRadius: '12px' }}>
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>Register New Asset</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add fresh inventory to the central registry</div>
                                        </div>
                                    </div>
                                </Link>
                            )}

                            <button onClick={handleExport} className="glass glass-interactive" style={{
                                padding: '1.25rem',
                                textAlign: 'left',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex',
                                gap: '1.25rem',
                                alignItems: 'center',
                                width: '100%',
                                borderRadius: 'var(--radius-md)',
                                background: 'transparent',
                                cursor: 'pointer'
                            }}>
                                <div style={{ color: 'var(--accent-primary)', background: 'var(--accent-light)', padding: '12px', borderRadius: '12px' }}>
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>Generate Usage Report</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Export full inventory telemetry to CSV</div>
                                </div>
                            </button>

                            <Link href="/orders/new" style={{ textDecoration: 'none' }}>
                                <div className="glass glass-interactive" style={{
                                    padding: '1.25rem',
                                    border: '1px solid var(--border-subtle)',
                                    display: 'flex',
                                    gap: '1.25rem',
                                    alignItems: 'center',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div style={{ color: 'var(--accent-primary)', background: 'var(--accent-light)', padding: '12px', borderRadius: '12px' }}>
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                                            Commit Purchase Request
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Log low-stock ordering intent to procurement</div>
                                    </div>
                                </div>
                            </Link>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
