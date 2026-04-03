import { useState, useRef, useCallback, useEffect } from 'react';

const WS_URL = 'ws://127.0.0.1:8000/ws/voice';

// AudioWorklet processor — converts Float32 mic input to Int16 PCM for Deepgram
const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const ch = inputs[0]?.[0];
        if (ch?.length) {
            const pcm = new Int16Array(ch.length);
            for (let i = 0; i < ch.length; i++) {
                pcm[i] = Math.max(-32768, Math.min(32767, ch[i] * 32767));
            }
            this.port.postMessage(pcm.buffer, [pcm.buffer]);
        }
        return true;
    }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export function useKleosVoice({ onRoute, onOrbStateChange, onBriefFill }) {
    const [listening, setListening] = useState(false);
    const [awake, setAwake] = useState(false);

    const wsRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const onRouteRef = useRef(onRoute);
    const onOrbStateChangeRef = useRef(onOrbStateChange);
    const onBriefFillRef = useRef(onBriefFill);
    const audioCtxRef = useRef(null);
    const processorRef = useRef(null);
    const sourceRef = useRef(null);
    const streamRef = useRef(null);
    const workletUrlRef = useRef(null);
    const unlockedRef = useRef(false);

    useEffect(() => { onRouteRef.current = onRoute; }, [onRoute]);
    useEffect(() => { onOrbStateChangeRef.current = onOrbStateChange; }, [onOrbStateChange]);
    useEffect(() => { onBriefFillRef.current = onBriefFill; }, [onBriefFill]);

    // ── Audio playback ────────────────────────────────────────────────────────
    const playAudio = useCallback((base64mp3, keepAwake = true) => {
        const audioBytes = Uint8Array.from(atob(base64mp3), c => c.charCodeAt(0));
        const blob = new Blob([audioBytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        isSpeakingRef.current = true;

        const onDone = () => {
            isSpeakingRef.current = false;
            // Tell backend we finished playing so it resumes transcript processing
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'speaking_done' }));
            }
            if (keepAwake) {
                setAwake(true);
                onOrbStateChangeRef.current('listening');
            } else {
                setAwake(false);
                onOrbStateChangeRef.current('idle');
            }
        };

        audio.onended = () => { URL.revokeObjectURL(url); onDone(); };
        audio.onerror = () => { URL.revokeObjectURL(url); onDone(); };
        audio.play().catch(err => {
            console.error('Audio play error:', err);
            isSpeakingRef.current = false;
        });
    }, []);

    // ── Unlock audio context on first user interaction ────────────────────────
    useEffect(() => {
        const unlock = () => {
            if (unlockedRef.current) return;
            unlockedRef.current = true;
            // Play silent audio to prime the browser autoplay policy
            const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
            silent.play().catch(() => {});
            document.removeEventListener('click', unlock);
        };
        document.addEventListener('click', unlock);
        return () => document.removeEventListener('click', unlock);
    }, []);

    // ── WebSocket connection ──────────────────────────────────────────────────
    useEffect(() => {
        let active = true;
        let reconnectTimer;

        function connect() {
            if (!active) return;
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);

                if (msg.type === 'state') {
                    if (msg.value === 'listening') setAwake(true);
                    if (msg.value === 'idle') setAwake(false);
                    onOrbStateChangeRef.current(msg.value);
                }
                if (msg.type === 'audio') {
                    playAudio(msg.data, msg.keepAwake !== false);
                }
                if (msg.type === 'route') {
                    const check = setInterval(() => {
                        if (!isSpeakingRef.current) {
                            clearInterval(check);
                            onRouteRef.current(msg.section);
                        }
                    }, 100);
                }
                if (msg.type === 'brief_fill') {
                    const check = setInterval(() => {
                        if (!isSpeakingRef.current) {
                            clearInterval(check);
                            onBriefFillRef.current?.(msg.projectName, msg.briefText);
                        }
                    }, 100);
                }
            };

            ws.onclose = () => {
                if (active) reconnectTimer = setTimeout(connect, 2000);
            };

            ws.onerror = () => ws.close();
        }

        connect();

        return () => {
            active = false;
            clearTimeout(reconnectTimer);
            wsRef.current?.close();
        };
    }, [playAudio]);

    // ── Mic streaming via AudioWorklet → 16kHz Linear16 PCM ──────────────────
    useEffect(() => {
        let active = true;

        async function startMic() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                    },
                });

                if (!active) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;

                // Create AudioContext at 16kHz — resamples mic input automatically
                const audioCtx = new AudioContext({ sampleRate: 16000 });
                audioCtxRef.current = audioCtx;

                // Register worklet from blob URL (avoids needing a separate file)
                const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
                const workletUrl = URL.createObjectURL(blob);
                workletUrlRef.current = workletUrl;
                await audioCtx.audioWorklet.addModule(workletUrl);

                const source = audioCtx.createMediaStreamSource(stream);
                sourceRef.current = source;

                const processor = new AudioWorkletNode(audioCtx, 'pcm-processor');
                processorRef.current = processor;

                // Each message is an Int16 ArrayBuffer — send directly as binary
                processor.port.onmessage = (e) => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(e.data);
                    }
                };

                source.connect(processor);
                // Do NOT connect processor to destination — avoids mic playback

                setListening(true);
            } catch (err) {
                if (err.name !== 'NotAllowedError') {
                    console.error('Mic error:', err);
                }
                setListening(false);
            }
        }

        startMic();

        return () => {
            active = false;
            processorRef.current?.disconnect();
            sourceRef.current?.disconnect();
            audioCtxRef.current?.close().catch(() => {});
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (workletUrlRef.current) URL.revokeObjectURL(workletUrlRef.current);
            setListening(false);
        };
    }, []);

    return { listening, awake };
}
