import { useEffect, useRef } from 'react';

function warmColor(norm, alpha) {
    const stops = [[255,70,15],[255,120,40],[255,180,80],[255,230,160],[255,200,100],[240,90,20],[190,40,5]];
    const idx = norm * (stops.length - 1);
    const lo = Math.floor(idx), hi = Math.min(lo + 1, stops.length - 1), f = idx - lo;
    const r = Math.round(stops[lo][0] + (stops[hi][0] - stops[lo][0]) * f);
    const g = Math.round(stops[lo][1] + (stops[hi][1] - stops[lo][1]) * f);
    const b = Math.round(stops[lo][2] + (stops[hi][2] - stops[lo][2]) * f);
    return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

function buildGeodesic() {
    const verts = [], edges = [];
    const phi = (1 + Math.sqrt(5)) / 2;
    [[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].forEach(v => {
        const l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        verts.push([v[0]/l, v[1]/l, v[2]/l]);
    });
    function addFace(v0, v1, v2, depth) {
        if (depth === 0) {
            const key = (a, b) => `${Math.min(a,b)}-${Math.max(a,b)}`;
            const addEdge = (a, b) => { const k = key(a, b); if (!edges.find(e => e.k === k)) edges.push({a, b, k}); };
            addEdge(v0, v1); addEdge(v1, v2); addEdge(v2, v0); return;
        }
        const mid = (a, b) => {
            const v = [(verts[a][0]+verts[b][0])/2, (verts[a][1]+verts[b][1])/2, (verts[a][2]+verts[b][2])/2];
            const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
            verts.push([v[0]/len, v[1]/len, v[2]/len]); return verts.length - 1;
        };
        const m01 = mid(v0,v1), m12 = mid(v1,v2), m20 = mid(v2,v0);
        addFace(v0,m01,m20,depth-1); addFace(m01,v1,m12,depth-1);
        addFace(m20,m12,v2,depth-1); addFace(m01,m12,m20,depth-1);
    }
    [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]].forEach(f => addFace(f[0],f[1],f[2],3));
    return { verts, edges };
}

// state: 'idle' | 'listening' | 'speaking'
export default function KleosOrb({ size = 340, state = 'idle' }) {
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const stateRef = useRef(state);

    useEffect(() => { stateRef.current = state; }, [state]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        const ctx = canvas.getContext('2d');
        const { verts: geoVerts, edges: geoEdges } = buildGeodesic();

        let W, H, cx, cy, SPHERE_R;

        function resize() {
            const s = Math.min(wrap.clientWidth, size);
            W = s; H = s;
            cx = W / 2; cy = H / 2;
            SPHERE_R = s * 0.376;
            canvas.width = W;
            canvas.height = H;
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
        }

        resize();

        const dust = [];
        for (let i = 0; i < 260; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi2 = Math.acos(2 * Math.random() - 1);
            const r = SPHERE_R * (1.05 + Math.random() * 0.35);
            dust.push({ theta, phi2, baseR: r, size: 0.4 + Math.random() * 1.6, opacity: 0.08 + Math.random() * 0.4, speedT: (Math.random() - 0.5) * 0.006, speedP: (Math.random() - 0.5) * 0.004, ps: 0.3 + Math.random() * 1.2, po: Math.random() * Math.PI * 2 });
        }

        function project(v, rotY, rotX) {
            const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
            const x1 = v[0]*cosY + v[2]*sinY, z1 = -v[0]*sinY + v[2]*cosY;
            const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
            const y1 = v[1]*cosX - z1*sinX, z2 = v[1]*sinX + z1*cosX;
            const scale = SPHERE_R / (1 + z2 * 0.18);
            return [cx + x1*scale, cy + y1*scale, z2];
        }

        let t = 0, rotY = 0, animId;

        function getStateModifiers() {
            const s = stateRef.current;
            if (s === 'listening') return { rotSpeed: 0.012, pulseAmp: 1.4, glowAlpha: 0.35, coreScale: 0.85 };
            if (s === 'speaking')  return { rotSpeed: 0.008, pulseAmp: 0.6, glowAlpha: 0.55, coreScale: 1.3 };
            return                        { rotSpeed: 0.005, pulseAmp: 1.0, glowAlpha: 0.22, coreScale: 1.0 };
        }

        function draw() {
            const mod = getStateModifiers();
            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'source-over';

            const bgG = ctx.createRadialGradient(cx, cy, 0, cx, cy, SPHERE_R + 50);
            bgG.addColorStop(0, 'rgba(180,65,10,0.28)');
            bgG.addColorStop(0.5, 'rgba(100,30,3,0.12)');
            bgG.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(cx, cy, SPHERE_R + 50, 0, Math.PI * 2);
            ctx.fillStyle = bgG; ctx.fill();

            for (const d of dust) {
                d.theta += d.speedT; d.phi2 += d.speedP;
                const pulse = 0.6 + 0.4 * mod.pulseAmp * Math.abs(Math.sin(t * d.ps + d.po));
                const r = d.baseR * (0.96 + 0.08 * Math.sin(t * d.ps * 0.5 + d.po));
                const x = cx + r * Math.sin(d.phi2) * Math.cos(d.theta);
                const y = cy + r * Math.sin(d.phi2) * Math.sin(d.theta) * 0.6;
                const z = r * Math.cos(d.phi2);
                const depthFade = (z / r + 1) / 2;
                const norm = ((d.theta % (Math.PI*2)) + Math.PI*2) % (Math.PI*2) / (Math.PI*2);
                ctx.beginPath(); ctx.arc(x, y, d.size * pulse, 0, Math.PI * 2);
                ctx.fillStyle = warmColor(norm, d.opacity * depthFade * pulse);
                ctx.fill();
            }

            ctx.globalCompositeOperation = 'screen';
            const glowG = ctx.createRadialGradient(cx, cy, SPHERE_R * 0.5, cx, cy, SPHERE_R + 8);
            glowG.addColorStop(0, 'rgba(0,0,0,0)');
            glowG.addColorStop(0.7, 'rgba(255,120,30,0.06)');
            glowG.addColorStop(0.88, `rgba(255,190,80,${mod.glowAlpha})`);
            glowG.addColorStop(0.95, 'rgba(255,150,50,0.14)');
            glowG.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(cx, cy, SPHERE_R + 8, 0, Math.PI * 2);
            ctx.fillStyle = glowG; ctx.fill();

            ctx.globalCompositeOperation = 'source-over';
            const projected = geoVerts.map(v => project(v, rotY, 0.28));
            [...geoEdges]
                .sort((a, b) => ((projected[a.a][2] + projected[a.b][2]) / 2) - ((projected[b.a][2] + projected[b.b][2]) / 2))
                .forEach(e => {
                    const pa = projected[e.a], pb = projected[e.b];
                    const avgZ = (pa[2] + pb[2]) / 2;
                    const depthFade = (avgZ + 1) / 2;
                    ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]);
                    ctx.strokeStyle = warmColor(depthFade, 0.1 + 0.6 * depthFade);
                    ctx.lineWidth = 0.5 + depthFade * 0.8; ctx.stroke();
                });

            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath(); ctx.arc(cx, cy, SPHERE_R, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,220,140,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

            const coreSize = SPHERE_R * 0.22 * mod.coreScale;
            const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
            coreG.addColorStop(0, 'rgba(255,255,240,0.95)');
            coreG.addColorStop(0.3, 'rgba(255,200,100,0.55)');
            coreG.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
            ctx.fillStyle = coreG; ctx.fill();

            ctx.globalCompositeOperation = 'source-over';
            rotY += mod.rotSpeed; t += 0.013;
            animId = requestAnimationFrame(draw);
        }

        draw();

        const observer = new ResizeObserver(() => resize());
        observer.observe(wrap);

        return () => { cancelAnimationFrame(animId); observer.disconnect(); };
    }, [size]);

    return (
        <div ref={wrapRef} style={{ width: '100%', maxWidth: `${size}px`, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas ref={canvasRef} />
        </div>
    );
}
