import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import KleosOrb from '../components/KleosOrb';
import DesignBriefMoodBoard from '../components/DesignBriefMoodBoard';
import { generateDesignBrief } from '../services/kleosApi';
import { useKleosVoice } from '../hooks/useKleosVoice';

// ─── Space background ────────────────────────────────────────────────────────

function SpaceBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let W = window.innerWidth;
        let H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        const stars = Array.from({ length: 320 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.4 + 0.2,
            opacity: Math.random() * 0.6 + 0.08,
            speedX: (Math.random() - 0.5) * 0.12,
            speedY: (Math.random() - 0.5) * 0.12,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.008 + Math.random() * 0.018,
            warm: Math.random() > 0.6,
        }));

        let animId;

        function draw() {
            ctx.fillStyle = '#05020f';
            ctx.fillRect(0, 0, W, H);

            for (const s of stars) {
                s.x += s.speedX;
                s.y += s.speedY;
                s.twinkle += s.twinkleSpeed;

                if (s.x < 0) s.x = W;
                if (s.x > W) s.x = 0;
                if (s.y < 0) s.y = H;
                if (s.y > H) s.y = 0;

                const alpha = s.opacity * (0.65 + 0.35 * Math.sin(s.twinkle));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fillStyle = s.warm
                    ? `rgba(255, 180, 100, ${alpha})`
                    : `rgba(220, 210, 255, ${alpha})`;
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        }

        draw();

        const handleResize = () => {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W;
            canvas.height = H;
        };
        window.addEventListener('resize', handleResize);

        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
    }, []);

    return (
        <canvas ref={canvasRef} style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
        }} />
    );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const HomeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const BriefIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const ProjectsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);

const SignOutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const MicIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

// ─── Section panels ───────────────────────────────────────────────────────────

function HomePanel({ user }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const name = user?.user_metadata?.name?.split(' ')[0] || 'creator';

    return (
        <div className="kleos-panel" style={panelStyles.wrap}>
            <p style={panelStyles.eyebrow}>Dashboard</p>
            <h2 style={panelStyles.title}>{greeting}, {name}</h2>
            <p style={panelStyles.sub}>What will you create today?</p>
            <div style={panelStyles.quickActions}>
                <div style={panelStyles.card}>
                    <p style={panelStyles.cardLabel}>New Brief</p>
                    <p style={panelStyles.cardSub}>Describe a vision, get AI directions and inspiration</p>
                    <span style={panelStyles.cardTag}>Sprint 3</span>
                </div>
                <div style={panelStyles.card}>
                    <p style={panelStyles.cardLabel}>Your Library</p>
                    <p style={panelStyles.cardSub}>Browse and revisit your saved projects</p>
                    <span style={panelStyles.cardTag}>Sprint 3</span>
                </div>
            </div>
        </div>
    );
}

const PROJECT_TYPES = [
    'Brand Identity', 'UI / Product Design', 'Editorial / Print',
    'Packaging', 'Motion / Video', 'Environmental / Spatial', 'Other',
];

function BriefPanel({ onOrbStateChange, voiceBrief, onVoiceBriefConsumed }) {
    const [projectType, setProjectType] = useState('');
    const [brief, setBrief] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [moodBoard, setMoodBoard] = useState(null);

    const runBrief = useCallback(async (type, briefText) => {
        setError('');
        setMoodBoard(null);
        setLoading(true);
        onOrbStateChange('thinking');
        try {
            const data = await generateDesignBrief(type, briefText);
            setMoodBoard(data);
            onOrbStateChange('speaking');
            setTimeout(() => onOrbStateChange('idle'), 2000);
        } catch {
            setError('Something went wrong. Please try again.');
            onOrbStateChange('idle');
        } finally {
            setLoading(false);
        }
    }, [onOrbStateChange]);

    // Voice auto-fill — fills fields then auto-submits after a beat
    useEffect(() => {
        if (!voiceBrief) return;
        const { projectName, briefText } = voiceBrief;
        setProjectType(projectName);
        setBrief(briefText);
        onVoiceBriefConsumed();
        const timer = setTimeout(() => runBrief(projectName, briefText), 700);
        return () => clearTimeout(timer);
    }, [voiceBrief]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSubmit = (e) => {
        e.preventDefault();
        runBrief(projectType, brief);
    };

    return (
        <div className="kleos-panel" style={panelStyles.wrap}>
            <p style={panelStyles.eyebrow}>New Brief</p>
            <h2 style={panelStyles.title}>Describe your vision</h2>
            <p style={panelStyles.sub}>Kleos will generate a full mood board — color, type, references, and direction.</p>

            <form onSubmit={handleSubmit} style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
                <div>
                    <label style={panelStyles.label}>Project type</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {PROJECT_TYPES.map(t => (
                            <button
                                key={t} type="button"
                                onClick={() => setProjectType(t)}
                                style={{
                                    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                    border: projectType === t ? '1px solid rgba(255,140,66,0.6)' : '1px solid rgba(255,150,60,0.15)',
                                    background: projectType === t ? 'rgba(255,140,66,0.12)' : 'transparent',
                                    color: projectType === t ? 'rgba(255,200,120,0.95)' : 'rgba(255,200,150,0.4)',
                                    transition: 'all 0.15s',
                                }}
                            >{t}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label style={panelStyles.label}>Brief</label>
                    <textarea
                        className="kleos-input"
                        rows={6}
                        value={brief}
                        onChange={e => setBrief(e.target.value)}
                        placeholder="Describe the project — client, audience, mood, references, colours, anything that matters..."
                        required
                    />
                </div>
                {error && <p style={{ color: '#ff6b4a', fontSize: '12px' }}>{error}</p>}
                <button
                    type="submit"
                    style={{ ...panelStyles.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                    disabled={loading}
                >
                    {loading ? 'Kleos is thinking...' : 'Generate Mood Board'}
                </button>
            </form>

            <DesignBriefMoodBoard data={moodBoard} />
        </div>
    );
}

function ProjectsPanel() {
    return (
        <div className="kleos-panel" style={panelStyles.wrap}>
            <p style={panelStyles.eyebrow}>Projects</p>
            <h2 style={panelStyles.title}>Your library</h2>
            <p style={panelStyles.sub}>All your briefs and saved directions live here.</p>
            <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.4 }}>
                <ProjectsIcon />
                <p style={{ color: 'rgba(255,200,150,0.6)', fontSize: '13px' }}>No projects yet. Start your first brief.</p>
            </div>
        </div>
    );
}

function SettingsPanel({ user, onSignOut }) {
    return (
        <div className="kleos-panel" style={panelStyles.wrap}>
            <p style={panelStyles.eyebrow}>Settings</p>
            <h2 style={panelStyles.title}>Account</h2>
            <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '360px' }}>
                <div style={panelStyles.infoRow}>
                    <span style={panelStyles.infoLabel}>Name</span>
                    <span style={panelStyles.infoValue}>{user?.user_metadata?.name || '—'}</span>
                </div>
                <div style={panelStyles.infoRow}>
                    <span style={panelStyles.infoLabel}>Email</span>
                    <span style={panelStyles.infoValue}>{user?.email || '—'}</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,150,60,0.1)', paddingTop: '20px' }}>
                    <button onClick={onSignOut} style={panelStyles.signOutBtn}>
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}

const panelStyles = {
    wrap: {
        padding: '48px 40px',
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
    },
    eyebrow: {
        color: 'rgba(255,200,140,0.4)',
        fontSize: '10px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '10px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    title: {
        color: '#fff',
        fontFamily: 'Varoste, sans-serif',
        fontSize: '26px',
        letterSpacing: '1px',
        marginBottom: '8px',
        fontWeight: 'normal',
    },
    sub: {
        color: 'rgba(255,200,150,0.35)',
        fontSize: '13px',
        lineHeight: 1.7,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    label: {
        display: 'block',
        color: 'rgba(255,200,150,0.5)',
        fontSize: '11px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '8px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    btn: {
        padding: '13px',
        borderRadius: '50px',
        border: 'none',
        background: 'linear-gradient(135deg, #ffd280, #ff8c42, #c85a10)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    quickActions: {
        display: 'flex',
        gap: '16px',
        marginTop: '32px',
        flexWrap: 'wrap',
    },
    card: {
        flex: '1',
        minWidth: '200px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,150,60,0.12)',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    cardLabel: {
        color: 'rgba(255,200,150,0.8)',
        fontSize: '14px',
        fontWeight: '500',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    cardSub: {
        color: 'rgba(255,200,150,0.35)',
        fontSize: '12px',
        lineHeight: 1.6,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    cardTag: {
        display: 'inline-block',
        marginTop: '4px',
        color: 'rgba(255,140,66,0.5)',
        fontSize: '10px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid rgba(255,150,60,0.08)',
    },
    infoLabel: {
        color: 'rgba(255,200,150,0.4)',
        fontSize: '11px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    infoValue: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: '13px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    signOutBtn: {
        padding: '10px 24px',
        borderRadius: '50px',
        border: '1px solid rgba(255,100,60,0.3)',
        background: 'transparent',
        color: 'rgba(255,120,80,0.7)',
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        transition: 'border-color 0.2s, color 0.2s',
    },
    directionCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,150,60,0.12)',
        borderRadius: '14px',
        padding: '20px',
    },
    directionName: {
        color: '#fff',
        fontFamily: 'Varoste, sans-serif',
        fontSize: '16px',
        letterSpacing: '0.5px',
        marginBottom: '8px',
        fontWeight: 'normal',
    },
    directionDesc: {
        color: 'rgba(255,200,150,0.55)',
        fontSize: '13px',
        lineHeight: 1.7,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    keyword: {
        background: 'rgba(255,140,66,0.08)',
        border: '1px solid rgba(255,140,66,0.18)',
        color: 'rgba(255,180,100,0.7)',
        fontSize: '10px',
        padding: '3px 10px',
        borderRadius: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        letterSpacing: '0.5px',
    },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { id: 'home',     icon: <HomeIcon />,     label: 'Home' },
    { id: 'brief',    icon: <BriefIcon />,    label: 'New Brief' },
    { id: 'projects', icon: <ProjectsIcon />, label: 'Projects' },
    { id: 'settings', icon: <SettingsIcon />, label: 'Settings' },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(null);
    const [user, setUser] = useState(null);
    const [orbState, setOrbState] = useState('idle');
    const [voiceBrief, setVoiceBrief] = useState(null);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/signin');
    };

    const handleNav = (id) => {
        setActiveSection(prev => prev === id ? null : id);
    };

    const handleRoute = useCallback((section) => {
        setActiveSection(section);
    }, []);

    const handleBriefFill = useCallback((projectName, briefText) => {
        setActiveSection('brief');
        setVoiceBrief({ projectName, briefText });
    }, []);

    const { listening, awake } = useKleosVoice({
        onRoute: handleRoute,
        onOrbStateChange: setOrbState,
        onBriefFill: handleBriefFill,
    });

    const isExpanded = activeSection !== null;

    const renderPanel = () => {
        switch (activeSection) {
            case 'home':     return <HomePanel user={user} />;
            case 'brief':    return <BriefPanel onOrbStateChange={setOrbState} voiceBrief={voiceBrief} onVoiceBriefConsumed={() => setVoiceBrief(null)} />;
            case 'projects': return <ProjectsPanel />;
            case 'settings': return <SettingsPanel user={user} onSignOut={handleSignOut} />;
            default:         return null;
        }
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            <SpaceBackground />

            {/* Sidebar */}
            <aside className="kleos-sidebar" style={{
                width: '64px',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 0',
                position: 'relative',
                zIndex: 10,
                flexShrink: 0,
                background: 'rgba(5, 2, 15, 0.65)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
            }}>
                {/* Logo */}
                <div style={{
                    width: '32px', height: '32px', borderRadius: '9px',
                    background: 'linear-gradient(135deg, #FF8C42, #E85D24)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 12px rgba(232,93,36,0.5)',
                    marginBottom: '28px', flexShrink: 0,
                }}>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700', fontFamily: 'Varoste, sans-serif' }}>K</span>
                </div>

                {/* Nav items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`kleos-nav-item${activeSection === item.id ? ' active' : ''}`}
                            onClick={() => handleNav(item.id)}
                            title={item.label}
                        >
                            {item.icon}
                            <span className="tooltip">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sign out */}
                <button
                    className="kleos-nav-item"
                    onClick={handleSignOut}
                    title="Sign out"
                    style={{ marginTop: 'auto' }}
                >
                    <SignOutIcon />
                    <span className="tooltip">Sign out</span>
                </button>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, position: 'relative', zIndex: 5, overflow: 'hidden' }}>

                {/* Orb — transitions from center to top-left */}
                <div style={{
                    position: 'absolute',
                    zIndex: 6,
                    transition: 'top 0.7s cubic-bezier(0.4,0,0.2,1), left 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
                    ...(isExpanded ? {
                        top: '16px',
                        left: '16px',
                        transform: 'scale(0.38)',
                        transformOrigin: 'top left',
                    } : {
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%) scale(1)',
                        transformOrigin: 'center center',
                    }),
                }}>
                    <KleosOrb size={280} state={orbState} />
                </div>

                {/* Mic / Activate — only visible when orb is centered */}
                {!isExpanded && (
                    <div style={{
                        position: 'absolute',
                        top: 'calc(50% + 160px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        animation: 'fadeIn 0.4s ease forwards',
                    }}>
                        {!activated ? (
                            <button
                                onClick={() => setActivated(true)}
                                style={{
                                    padding: '10px 28px',
                                    borderRadius: '50px',
                                    border: '1px solid rgba(255,140,66,0.35)',
                                    background: 'rgba(255,140,66,0.08)',
                                    color: 'rgba(255,200,120,0.85)',
                                    fontSize: '12px',
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                Activate Kleos
                            </button>
                        ) : (
                            <>
                                <button className="gradient-border" style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: awake ? 'rgba(255,140,66,0.2)' : listening ? 'rgba(255,140,66,0.08)' : 'transparent',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'default',
                                    color: awake ? 'rgba(255,200,100,1)' : listening ? 'rgba(255,180,100,0.6)' : 'rgba(255,180,100,0.25)',
                                    transition: 'background 0.2s, color 0.2s',
                                }}>
                                    <MicIcon />
                                </button>
                                <p style={{
                                    color: awake ? 'rgba(255,200,100,0.8)' : listening ? 'rgba(255,180,100,0.4)' : 'rgba(255,200,150,0.15)',
                                    fontSize: '11px',
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                    transition: 'color 0.2s',
                                }}>{awake ? 'Go ahead...' : listening ? 'Say "Kleos"' : 'Always listening'}</p>
                            </>
                        )}
                    </div>
                )}

                {/* Content panel — slides in when section is active */}
                {isExpanded && (
                    <div style={{
                        position: 'absolute',
                        top: 0, right: 0, bottom: 0,
                        left: '120px',
                        zIndex: 5,
                        overflowY: 'auto',
                    }}>
                        {renderPanel()}
                    </div>
                )}
            </main>
        </div>
    );
}
