"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Key, Users, Shield, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function UsersManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this user? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (res.ok) fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>Personnel Registry</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage security clearance and system access protocols.</p>
                    </div>
                    <Link href="/admin/users/form" className="button-primary" style={{ textDecoration: 'none' }}>
                        <Plus size={18} /> Add Personnel
                    </Link>
                </div>

                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
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
                                <th>Personnel Detail</th>
                                <th>Access Email</th>
                                <th>Clearance</th>
                                <th style={{ textAlign: 'right' }}>Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600 }}>Loading registry...</div>
                                </td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    No personnel records found.
                                </td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>ID: {user._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-success'}`} style={{ gap: '0.4rem' }}>
                                            {user.role === 'admin' ? <ShieldAlert size={12} /> : <Shield size={12} />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Link href={`/admin/users/form?id=${user._id}`} title="Edit Profile & Key" className="action-btn">
                                                <Edit2 size={14} />
                                            </Link>
                                            <button onClick={() => handleDelete(user._id)} title="Revoke Access" className="action-btn" style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>
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
