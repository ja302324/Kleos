import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import KleosOrb from '../components/KleosOrb';

const styles = {
    page: {
        background: 'linear-gradient(160deg, #1a0800 0%, #240d02 18%, #3a1800 35%, #4a1e05 52%, #6b2e0a 67%, #8a3d14 80%, #a84d20 90%, #c05828 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: 'relative',
    },
    nav: {
        position: 'absolute',
        top: '20px',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 10,
    },
    navLogo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
    },
    navIcon: {
        width: '26px',
        height: '26px',
        borderRadius: '7px',
        background: 'linear-gradient(135deg, #FF8C42, #E85D24)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(232,93,36,0.5)',
    },
    navK: { color: '#fff', fontSize: '13px', fontWeight: '600' },
    navName: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: '16px',
        fontFamily: 'Varoste, sans-serif',
        letterSpacing: '1px',
    },
    orbWrap: {
        marginBottom: '12px',
    },
    heading: {
        color: '#fff',
        fontFamily: 'Varoste, sans-serif',
        fontSize: '22px',
        letterSpacing: '1px',
        marginBottom: '4px',
        textAlign: 'center',
    },
    subheading: {
        color: 'rgba(255,200,150,0.4)',
        fontSize: '12px',
        marginBottom: '28px',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        maxWidth: '320px',
    },
    fieldWrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        color: 'rgba(255,200,150,0.55)',
        fontSize: '11px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
    },
    input: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,150,60,0.2)',
        borderRadius: '10px',
        padding: '11px 14px',
        color: '#fff',
        fontSize: '14px',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    },
    submitBtn: {
        marginTop: '6px',
        width: '100%',
        padding: '13px',
        borderRadius: '50px',
        border: 'none',
        background: 'linear-gradient(135deg, #ffd280, #ff8c42, #c85a10)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 6px 28px rgba(232,93,36,0.45)',
        letterSpacing: '0.5px',
    },
    footer: {
        marginTop: '20px',
        color: 'rgba(255,200,150,0.35)',
        fontSize: '12px',
        textAlign: 'center',
    },
    footerLink: {
        color: 'rgba(255,150,60,0.8)',
        textDecoration: 'none',
    },
    error: {
        color: '#ff6b4a',
        fontSize: '12px',
        textAlign: 'center',
        marginTop: '-6px',
    },
};

export default function SignIn() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [orbState, setOrbState] = useState('idle');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setOrbState('listening');
        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (authError) {
            setOrbState('idle');
            setError(authError.message);
        } else {
            console.log('Sign in successful:', data);
            setOrbState('speaking');
            setTimeout(() => navigate('/dashboard'), 1200);
        }
    };

    return (
        <div style={styles.page}>
            <nav style={styles.nav}>
                <Link to="/" style={styles.navLogo}>
                    <div style={styles.navIcon}><span style={styles.navK}>K</span></div>
                    <span style={styles.navName}>Kleos</span>
                </Link>
            </nav>

            <div style={styles.orbWrap}>
                <KleosOrb size={120} state={orbState} />
            </div>

            <h1 style={styles.heading}>Welcome back</h1>
            <p style={styles.subheading}>Kleos is ready when you are</p>

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.fieldWrap}>
                    <label htmlFor="email" style={styles.label}>Email</label>
                    <input
                        style={styles.input}
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div style={styles.fieldWrap}>
                    <label htmlFor="password" style={styles.label}>Password</label>
                    <input
                        style={styles.input}
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                    />
                </div>
                {error && <p style={styles.error}>{error}</p>}
                <button type="submit" style={styles.submitBtn}>Sign in</button>
            </form>

            <p style={styles.footer}>
                Don't have an account?{' '}
                <Link to="/signup" style={styles.footerLink}>Sign up</Link>
            </p>
        </div>
    );
}
