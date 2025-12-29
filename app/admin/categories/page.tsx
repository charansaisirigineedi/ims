"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Tag } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (res.ok) fetchCategories();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }} className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Categories Management</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Organize inventory items with custom categories.</p>
                    </div>
                    <Link href="/admin/categories/form" className="button-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none' }}>
                        <Plus size={18} /> Add New Category
                    </Link>
                </div>

                <div style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search categories..."
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
                                <th>Category Name</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '4rem' }}>
                                    <div className="animate-pulse" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600 }}>Loading categories...</div>
                                </td></tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    No categories found.
                                </td></tr>
                            ) : filteredCategories.map((category) => (
                                <tr key={category._id}>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ padding: '8px', background: 'var(--accent-light)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
                                            <Tag size={16} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{category.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>ID: {category._id.slice(-6).toUpperCase()}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>{new Date(category.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Link href={`/admin/categories/form?id=${category._id}`} className="action-btn">
                                                <Edit2 size={14} />
                                            </Link>
                                            <button onClick={() => handleDelete(category._id)} className="action-btn" style={{ color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>
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
