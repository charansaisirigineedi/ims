"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Beaker, LogOut, LayoutDashboard, Database, ClipboardList, FlaskConical, Tags, Users, Settings, ClipboardCheck, History as HistoryIcon } from "lucide-react";
import { usePathname } from "next/navigation";

export default function AdminNavbar() {
    const { data: session } = useSession();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

    const navItems = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/inventory', icon: Database, label: 'Inventory' },
        { href: '/approvals', icon: ClipboardList, label: 'Approvals' },
        { href: '/admin/labs', icon: FlaskConical, label: 'Labs' },
        { href: '/admin/categories', icon: Tags, label: 'Categories' },
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/orders', icon: HistoryIcon, label: 'Transactions' },
        { href: '/stock-take', icon: ClipboardCheck, label: 'Stock Take' }
    ];

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
                <span style={{
                    fontSize: '0.65rem',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 800,
                    marginLeft: '-4px',
                    marginTop: '-12px'
                }}>ADM</span>
            </Link>

            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {session && navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.625rem 0.875rem',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                transition: 'var(--transition-fast)',
                                ...(active ? {
                                    background: 'var(--accent-light)',
                                    color: 'var(--accent-primary)',
                                    border: '1px solid var(--accent-primary)'
                                } : {
                                    color: 'var(--text-secondary)',
                                    border: '1px solid transparent'
                                })
                            }}
                            className="glass-interactive"
                        >
                            <Icon size={16} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {session && (
                    <>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{session.user.name}</div>
                            <div style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-tertiary)',
                                textTransform: 'capitalize'
                            }}>
                                Administrator
                            </div>
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
                    </>
                )}
            </div>
        </nav>
    );
}
