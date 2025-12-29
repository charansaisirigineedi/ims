"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Beaker, LogOut, LayoutDashboard, Database, ClipboardCheck, History as HistoryIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function UserNavbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

    return (
        <nav style={{
            margin: '1.5rem 1.5rem 0',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: '1rem',
            zIndex: 100,
            background: 'var(--bg-card)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
        }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                <div style={{
                    background: 'var(--accent-light)',
                    padding: '8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Beaker size={20} color="var(--accent-primary)" />
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>LAB-IMS</span>
            </Link>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {session ? (
                    <>
                        <Link href="/dashboard" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            transition: 'var(--transition-fast)',
                            ...(isActive('/dashboard') ? {
                                background: 'var(--accent-light)',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--accent-primary)'
                            } : {
                                color: 'var(--text-secondary)',
                                border: '1px solid transparent'
                            })
                        }}>
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="/inventory" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            transition: 'var(--transition-fast)',
                            ...(isActive('/inventory') ? {
                                background: 'var(--accent-light)',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--accent-primary)'
                            } : {
                                color: 'var(--text-secondary)',
                                border: '1px solid transparent'
                            })
                        }}>
                            <Database size={18} />
                            <span>Inventory</span>
                        </Link>
                        <Link href="/orders" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            transition: 'var(--transition-fast)',
                            ...(isActive('/orders') ? {
                                background: 'var(--accent-light)',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--accent-primary)'
                            } : {
                                color: 'var(--text-secondary)',
                                border: '1px solid transparent'
                            })
                        }}>
                            <HistoryIcon size={18} />
                            <span>History</span>
                        </Link>
                        <Link href="/stock-take" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            transition: 'var(--transition-fast)',
                            ...(isActive('/stock-take') ? {
                                background: 'var(--accent-light)',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--accent-primary)'
                            } : {
                                color: 'var(--text-secondary)',
                                border: '1px solid transparent'
                            })
                        }}>
                            <ClipboardCheck size={18} />
                            <span>Stock Take</span>
                        </Link>

                        <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)', margin: '0 0.5rem' }}></div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{session.user.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{(session.user as any).role}</div>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="glass-interactive"
                                style={{
                                    background: '#FEE2E2',
                                    border: '1px solid #FECACA',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--status-error)',
                                    transition: 'var(--transition-fast)'
                                }}
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </>
                ) : (
                    <Link href="/auth/signin" className="button-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.9rem' }}>Sign In</Link>
                )}
            </div>
        </nav>
    );
}
