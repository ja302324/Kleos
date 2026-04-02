// ─── DesignBriefMoodBoard ─────────────────────────────────────────────────────
// Renders the full Kleos mood board output from /api/design-brief

const PinterestIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
);

const ExternalIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
);

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ label, children }) {
    return (
        <div style={{ marginBottom: '40px' }}>
            <p style={s.eyebrow}>{label}</p>
            {children}
        </div>
    );
}

// ── Visual Direction ──────────────────────────────────────────────────────────
function VisualDirection({ aesthetic, tone, visual_direction }) {
    return (
        <div style={s.glassCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <h3 style={s.aestheticName}>{aesthetic}</h3>
                <span style={s.tonePill}>{tone}</span>
            </div>
            <p style={s.bodyText}>{visual_direction}</p>
        </div>
    );
}

// ── Color Palette ─────────────────────────────────────────────────────────────
function ColorPalette({ palette, colormind }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Claude's palette */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {palette.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: '1', minWidth: '80px' }}>
                        <div style={{
                            width: '100%', height: '64px', borderRadius: '10px',
                            background: c.hex,
                            boxShadow: `0 4px 16px ${c.hex}44`,
                        }} />
                        <span style={s.colorHex}>{c.hex}</span>
                        {c.name && <span style={s.colorName}>{c.name}</span>}
                        <span style={s.colorMood}>{c.mood}</span>
                    </div>
                ))}
            </div>
            {/* Colormind bonus palette */}
            {colormind?.length > 0 && (
                <div>
                    <p style={{ ...s.eyebrow, marginTop: '16px', marginBottom: '8px' }}>AI Variation (Colormind)</p>
                    <div style={{ display: 'flex', gap: '6px', height: '28px', borderRadius: '8px', overflow: 'hidden' }}>
                        {colormind.map((hex, i) => (
                            <div key={i} style={{ flex: 1, background: hex }} title={hex} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Typography ────────────────────────────────────────────────────────────────
function Typography({ heading, body }) {
    return (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[{ label: 'Heading', data: heading }, { label: 'Body', data: body }].map(({ label, data }) => (
                <div key={label} style={{ ...s.glassCard, flex: '1', minWidth: '200px' }}>
                    <p style={s.eyebrow}>{label}</p>
                    <p style={{ color: '#fff', fontSize: '20px', fontWeight: '600', marginBottom: '4px', letterSpacing: '0.3px' }}>
                        {data.font}
                    </p>
                    <p style={{ color: 'rgba(255,200,150,0.45)', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
                        {data.style}
                    </p>
                    <p style={s.bodyText}>{data.rationale}</p>
                </div>
            ))}
        </div>
    );
}

// ── Keywords ──────────────────────────────────────────────────────────────────
function Keywords({ keywords }) {
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {keywords.map((kw, i) => (
                <span key={i} style={s.keyword}>{kw}</span>
            ))}
        </div>
    );
}

// ── Pexels Images ─────────────────────────────────────────────────────────────
function ImageGrid({ images }) {
    if (!images?.length) return null;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {images.map((img, i) => (
                <a key={i} href={img.link} target="_blank" rel="noreferrer"
                    style={{ display: 'block', position: 'relative', textDecoration: 'none' }}>
                    <img
                        src={img.thumb}
                        alt={img.credit}
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                    />
                    <div style={s.imgOverlay}>
                        <span style={s.imgCredit}>{img.credit}</span>
                        <span style={s.imgPlatform}>Pexels</span>
                    </div>
                </a>
            ))}
        </div>
    );
}

// Gradient backgrounds for Pinterest cards — one per slot, cycles
const PIN_GRADIENTS = [
    'linear-gradient(135deg, #1a0a2e, #3d1a5c)',
    'linear-gradient(135deg, #0a1628, #1a3a5c)',
    'linear-gradient(135deg, #1a1a0a, #3d3010)',
    'linear-gradient(135deg, #0a1a10, #103d20)',
    'linear-gradient(135deg, #1a0a0a, #3d1010)',
];

// ── Pinterest Suggestions ─────────────────────────────────────────────────────
function PinterestSuggestions({ suggestions }) {
    if (!suggestions?.length) return null;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {suggestions.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,150,60,0.1)',
                        background: PIN_GRADIENTS[i % PIN_GRADIENTS.length],
                        transition: 'border-color 0.2s, transform 0.2s',
                        cursor: 'pointer',
                    }}>
                        {/* Visual preview area */}
                        <div style={{
                            height: '90px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <span style={{
                                fontSize: '32px',
                                opacity: 0.15,
                                position: 'absolute',
                                color: '#fff',
                            }}>
                                <PinterestIcon />
                            </span>
                            <span style={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '11px',
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase',
                                fontFamily: '-apple-system, sans-serif',
                                textAlign: 'center',
                                padding: '0 16px',
                                position: 'relative',
                                zIndex: 1,
                            }}>{item.label}</span>
                        </div>
                        {/* Info strip */}
                        <div style={{ padding: '10px 14px 12px', background: 'rgba(0,0,0,0.3)' }}>
                            <p style={{ color: 'rgba(255,200,150,0.45)', fontSize: '11px', lineHeight: 1.6, margin: '0 0 8px' }}>{item.reason}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ color: '#E60023', flexShrink: 0 }}><PinterestIcon /></span>
                                <span style={{ color: 'rgba(255,200,150,0.35)', fontSize: '10px', fontFamily: '-apple-system, sans-serif' }}>Open on Pinterest</span>
                                <span style={{ color: 'rgba(255,200,150,0.25)', marginLeft: 'auto' }}><ExternalIcon /></span>
                            </div>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function DesignBriefMoodBoard({ data }) {
    if (!data) return null;
    return (
        <div style={{ marginTop: '40px' }}>
            <Section label="Creative Direction">
                <VisualDirection
                    aesthetic={data.aesthetic}
                    tone={data.tone}
                    visual_direction={data.visual_direction}
                />
            </Section>

            <Section label="Color Palette">
                <ColorPalette palette={data.color_palette || []} colormind={data.colormind_palette} />
            </Section>

            <Section label="Design Language">
                <Keywords keywords={data.design_keywords || []} />
            </Section>

            <Section label="Typography">
                <Typography heading={data.typography?.heading} body={data.typography?.body} />
            </Section>

            {data.images?.length > 0 && (
                <Section label="Visual References — Pexels">
                    <ImageGrid images={data.images} />
                    <p style={{ color: 'rgba(255,200,150,0.25)', fontSize: '10px', marginTop: '8px', lineHeight: 1.6 }}>
                        Images sourced from Pexels for creative reference only. All rights belong to their respective photographers. Click any image to view the original.
                    </p>
                </Section>
            )}

            <Section label="Explore on Pinterest">
                <PinterestSuggestions suggestions={data.pinterest_suggestions} />
            </Section>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
    eyebrow: {
        color: 'rgba(255,200,140,0.35)',
        fontSize: '10px',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        marginBottom: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    glassCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,150,60,0.12)',
        borderRadius: '16px',
        padding: '20px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
    },
    aestheticName: {
        color: '#fff',
        fontFamily: 'Varoste, sans-serif',
        fontSize: '18px',
        letterSpacing: '0.5px',
        fontWeight: 'normal',
        margin: 0,
    },
    tonePill: {
        background: 'rgba(255,140,66,0.1)',
        border: '1px solid rgba(255,140,66,0.2)',
        color: 'rgba(255,180,100,0.8)',
        fontSize: '10px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        padding: '3px 10px',
        borderRadius: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    bodyText: {
        color: 'rgba(255,200,150,0.5)',
        fontSize: '13px',
        lineHeight: 1.8,
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    colorHex: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '10px',
        fontFamily: 'monospace',
        letterSpacing: '0.5px',
    },
    colorName: {
        color: 'rgba(255,200,150,0.5)',
        fontSize: '9px',
        letterSpacing: '0.5px',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    colorMood: {
        color: 'rgba(255,200,150,0.3)',
        fontSize: '9px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    keyword: {
        background: 'rgba(255,140,66,0.07)',
        border: '1px solid rgba(255,140,66,0.15)',
        color: 'rgba(255,180,100,0.7)',
        fontSize: '11px',
        padding: '5px 14px',
        borderRadius: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        letterSpacing: '0.5px',
    },
    imgOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 6px 5px',
        background: 'linear-gradient(transparent, rgba(5,2,15,0.85))',
        borderRadius: '0 0 8px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    imgCredit: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: '9px',
        fontFamily: '-apple-system, sans-serif',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%',
    },
    imgPlatform: {
        fontSize: '8px', padding: '1px 5px', borderRadius: '4px',
        background: 'rgba(5,132,67,0.7)', color: '#fff',
        fontFamily: '-apple-system, sans-serif', flexShrink: 0,
    },
};

