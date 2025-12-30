"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Beaker, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid credentials. Please verify your access tokens.");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred during auth sync.");
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'var(--bg-body)',
            position: 'relative',
        }}>
            {/* Minimal Background Decoration */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50vh',
                background: 'linear-gradient(to bottom, var(--bg-subtle) 0%, transparent 100%)',
                zIndex: 0
            }} />

            <div className="animate-fade-in" style={{
                position: 'relative',
                zIndex: 1,
                maxWidth: '440px',
                width: '100%',
                padding: '2.5rem',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-subtle)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <Link href="/" style={{
                        color: 'var(--accent-primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        background: 'var(--accent-light)',
                        borderRadius: '16px',
                        marginBottom: '1.5rem',
                        textDecoration: 'none',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <ShieldCheck size={32} />
                    </Link>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Enter your credentials to access the secure registry.
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#FEE2E2',
                        border: '1px solid #FECACA',
                        color: '#991B1B',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="email"
                                required
                                className="input-base"
                                style={{ paddingLeft: '44px' }}
                                placeholder="researcher@lab.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Access Key
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="password"
                                required
                                className="input-base"
                                style={{ paddingLeft: '44px' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="button-primary"
                        disabled={loading}
                        style={{ marginTop: '0.75rem', width: '100%', padding: '12px' }}
                    >
                        {loading ? "Syncing..." : "Access System"}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
