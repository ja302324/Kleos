const LAST_UPDATED = 'April 2, 2026';
const CONTACT_EMAIL = 'savedbydesign@gmail.com'; // update if needed

export default function Privacy() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#05020f',
            color: 'rgba(255,200,150,0.8)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            padding: '60px 24px',
        }}>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>

                <p style={s.eyebrow}>Kleos by Saved By Design</p>
                <h1 style={s.title}>Privacy Policy</h1>
                <p style={s.meta}>Last updated: {LAST_UPDATED}</p>

                <p style={s.body}>
                    This Privacy Policy describes how Kleos ("we", "us", or "our") collects,
                    uses, and protects your information when you use our application.
                </p>

                <h2 style={s.heading}>1. Information We Collect</h2>
                <p style={s.body}>
                    When you create an account, we collect your <strong style={s.strong}>email address</strong> and{' '}
                    <strong style={s.strong}>name</strong>. This is the only personal information we collect.
                    We do not collect phone numbers, physical addresses, payment information, or location data.
                </p>

                <h2 style={s.heading}>2. How We Use Your Information</h2>
                <p style={s.body}>We use your information solely to:</p>
                <ul style={s.list}>
                    <li style={s.item}>Create and manage your account</li>
                    <li style={s.item}>Personalise your experience (e.g. displaying your name on the dashboard)</li>
                    <li style={s.item}>Allow you to sign in securely</li>
                </ul>
                <p style={s.body}>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

                <h2 style={s.heading}>3. Inspiration Images</h2>
                <p style={s.body}>
                    When you generate a design brief, Kleos fetches publicly available inspiration images
                    from <strong style={s.strong}>Pinterest</strong> and <strong style={s.strong}>Unsplash</strong> via
                    their official APIs. These images are displayed for creative reference only.
                    All image rights belong to their respective creators. Clicking any image takes you
                    directly to the original source where you can properly credit the artist.
                </p>
                <p style={s.body}>
                    We do not store, reproduce, or redistribute these images beyond displaying them
                    temporarily during your session.
                </p>

                <h2 style={s.heading}>4. Third-Party Services</h2>
                <p style={s.body}>Kleos uses the following third-party services to operate:</p>
                <ul style={s.list}>
                    <li style={s.item}><strong style={s.strong}>Supabase</strong> — authentication and account storage</li>
                    <li style={s.item}><strong style={s.strong}>Anthropic (Claude)</strong> — AI-generated design directions</li>
                    <li style={s.item}><strong style={s.strong}>ElevenLabs</strong> — text-to-speech voice responses</li>
                    <li style={s.item}><strong style={s.strong}>Pinterest API</strong> — design inspiration images</li>
                    <li style={s.item}><strong style={s.strong}>Unsplash API</strong> — photography inspiration images</li>
                </ul>
                <p style={s.body}>
                    Each of these services has its own privacy policy. We encourage you to review them.
                    We do not share your personal data with these services beyond what is necessary
                    to provide the app's functionality (e.g. your brief text is sent to Claude to
                    generate directions — it is not stored or used for training).
                </p>

                <h2 style={s.heading}>5. Data Security</h2>
                <p style={s.body}>
                    Your account credentials are managed by Supabase, which uses industry-standard
                    encryption. We do not store passwords. We take reasonable steps to protect your
                    information, but no system is completely secure.
                </p>

                <h2 style={s.heading}>6. Your Rights (CCPA / CalOPPA)</h2>
                <p style={s.body}>
                    If you are a California resident, you have the right to:
                </p>
                <ul style={s.list}>
                    <li style={s.item}>Know what personal information we collect and how it is used</li>
                    <li style={s.item}>Request deletion of your personal information</li>
                    <li style={s.item}>Opt out of the sale of personal information (we do not sell your data)</li>
                    <li style={s.item}>Not be discriminated against for exercising these rights</li>
                </ul>
                <p style={s.body}>To exercise any of these rights, contact us at the email below.</p>

                <h2 style={s.heading}>7. Children</h2>
                <p style={s.body}>
                    Kleos is not directed at children under 13. We do not knowingly collect
                    personal information from anyone under 13. If you believe a child has
                    provided us with their information, please contact us and we will delete it.
                </p>

                <h2 style={s.heading}>8. Changes to This Policy</h2>
                <p style={s.body}>
                    We may update this policy from time to time. We will post the updated version
                    here with a new "Last updated" date. Continued use of the app after changes
                    constitutes acceptance of the updated policy.
                </p>

                <h2 style={s.heading}>9. Contact</h2>
                <p style={s.body}>
                    For any questions about this Privacy Policy, contact us at:{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} style={s.link}>{CONTACT_EMAIL}</a>
                </p>

                <div style={s.footer}>
                    <p>© {new Date().getFullYear()} Saved By Design. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

const s = {
    eyebrow: {
        color: 'rgba(255,200,140,0.35)',
        fontSize: '10px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '10px',
    },
    title: {
        color: '#fff',
        fontFamily: 'Varoste, sans-serif',
        fontSize: '28px',
        letterSpacing: '1px',
        fontWeight: 'normal',
        marginBottom: '6px',
    },
    meta: {
        color: 'rgba(255,200,150,0.3)',
        fontSize: '12px',
        marginBottom: '36px',
    },
    heading: {
        color: 'rgba(255,200,150,0.9)',
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        marginTop: '36px',
        marginBottom: '10px',
    },
    body: {
        color: 'rgba(255,200,150,0.5)',
        fontSize: '13px',
        lineHeight: 1.8,
        marginBottom: '12px',
    },
    strong: {
        color: 'rgba(255,200,150,0.8)',
        fontWeight: '600',
    },
    list: {
        paddingLeft: '20px',
        marginBottom: '12px',
    },
    item: {
        color: 'rgba(255,200,150,0.5)',
        fontSize: '13px',
        lineHeight: 1.8,
        marginBottom: '4px',
    },
    link: {
        color: '#FF8C42',
        textDecoration: 'none',
    },
    footer: {
        marginTop: '60px',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255,150,60,0.1)',
        color: 'rgba(255,200,150,0.2)',
        fontSize: '11px',
    },
};
