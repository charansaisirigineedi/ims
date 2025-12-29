"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, FlaskConical } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LabsManagementPage() {
    const [labs, setLabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/labs");
            const data = await res.json();
            setLabs(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this lab?")) return;
        try {
            const res = await fetch(`/api/labs/${id}`, { method: "DELETE" });
            if (res.ok) fetchLabs();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredLabs = labs.filter(lab =>
        lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Labs Management</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Configure and oversee laboratory research environments.</p>
                    </div>
                    <Link href="/admin/labs/form" className="button-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none' }}>
                        <Plus size={18} /> Add New Lab
                    </Link>
                </div>

                <div style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search labs by name or description..."
                            className="input-base"
                            style={{ paddingLeft: '44px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Lab Name</th>
                                <th>Description</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600 }}>Loading labs...</div>
                                </td></tr>
                            ) : filteredLabs.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    No labs found.
                                </td></tr>
                            ) : filteredLabs.map((lab) => (
                                <tr key={lab._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lab.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>ID: {lab._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td style={{ maxWidth: '400px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {lab.description || <span style={{ opacity: 0.5 }}>No description provided</span>}
                                    </td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(lab.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Link href={`/admin/labs/form?id=${lab._id}`} className="action-btn">
                                                <Edit2 size={14} />
                                            </Link>
                                            <button onClick={() => handleDelete(lab._id)} className="action-btn" style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
