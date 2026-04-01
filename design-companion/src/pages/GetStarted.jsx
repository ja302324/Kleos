import { Link } from 'react-router-dom';
import KleosOrb from '../components/KleosOrb';

const styles = {
    landing: {
        background: 'linear-gradient(160deg, #1a0800 0%, #240d02 18%, #3a1800 35%, #4a1e05 52%, #6b2e0a 67%, #8a3d14 80%, #a84d20 90%, #c05828 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px 24px 40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    nav: {
        position: 'absolute',
        top: '20px',
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10,
    },
    navLogo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
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
    navK: {
        color: '#fff',
        fontSize: '13px',
        fontWeight: '600',
    },
    navName: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: '16px',
        fontFamily: 'Varoste, sans-serif',
        letterSpacing: '1px',
    },
    navSignIn: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: '12px',
        padding: '5px 13px',
        textDecoration: 'none',
        display: 'inline-block',
        background: 'transparent',
    },
    spiritWrap: {
        position: 'relative',
        width: '100%',
        maxWidth: '340px',
        marginBottom: '28px',
        zIndex: 2,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
    },
    heroText: {
        textAlign: 'center',
        zIndex: 2,
        position: 'relative',
        marginBottom: '32px',
    },
    eyebrow: {
        color: 'rgba(255,200,140,0.55)',
        fontSize: '10px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '8px',
    },
    heroTitle: {
        color: '#fff',
        fontSize: '28px',
        fontFamily: 'Varoste, sans-serif',
        lineHeight: 1.2,
        marginBottom: '10px',
        letterSpacing: '1px',
    },
    heroTitleSpan: {
        background: 'linear-gradient(135deg, #FF8C42, #ffcc88)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    heroSub: {
        color: 'rgba(255,200,150,0.4)',
        fontSize: '13px',
        lineHeight: 1.75,
        maxWidth: '280px',
        margin: '0 auto',
    },
    ctaWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '9px',
        zIndex: 2,
    },
    ctaNote: {
        color: 'rgba(255,180,100,0.25)',
        fontSize: '11px',
    },
    scrollHint: {
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: '14px',
        zIndex: 2,
    },
};

export default function GetStarted() {
    return (
        <div style={styles.landing}>
            <nav style={styles.nav}>
                <div style={styles.navLogo}>
                    <div style={styles.navIcon}>
                        <span style={styles.navK}>K</span>
                    </div>
                    <span style={styles.navName}>Kleos</span>
                </div>
                <Link to="/signin" style={styles.navSignIn} className="gradient-border">Sign in</Link>
            </nav>

            <div style={styles.spiritWrap}>
                <KleosOrb size={340} state="idle" />
            </div>

            <div style={styles.heroText}>
                <p style={styles.eyebrow}>Meet Kleos</p>
                <h1 style={styles.heroTitle}>
                    Your <span style={styles.heroTitleSpan}>creative spirit</span>,<br />
                    brought to life
                </h1>
                <p style={styles.heroSub}>
                    Describe your vision. Kleos finds the inspiration, suggests the direction, and helps you create.
                </p>
            </div>

            <div style={styles.ctaWrap}>
                <Link to="/signup" className="kleos-btn">Get started</Link>
                <span style={styles.ctaNote}>Free to start — no credit card required</span>
            </div>

            <div style={styles.scrollHint}>↓</div>
        </div>
    );
}
