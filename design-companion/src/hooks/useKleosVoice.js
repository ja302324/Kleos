import { useState, useRef, useCallback, useEffect } from 'react';

const WS_URL = 'ws://127.0.0.1:8000/ws/voice';

const WAKE_WORDS = ['kleos', 'hey kleos', "cleo's", "hey cleo's", 'cleos', 'hey cleos', 'close', 'hey close'];

const STT_CORRECTIONS = {
    "close":      "kleos",
    "cleo's":     "kleos",
    "cleos":      "kleos",
    "hey close":  "hey kleos",
    "hey cleo's": "hey kleos",
    "hey cleos":  "hey kleos",
};

function applyCorrections(text) {
    const lower = text.toLowerCase().trim();
    return STT_CORRECTIONS[lower] ?? lower;
}

function stripWakeWord(transcript) {
    let text = transcript.toLowerCase().trim();
    for (const w of WAKE_WORDS) {
        if (text.startsWith(w)) text = text.slice(w.length).trim();
    }
    return text;
}

export function useKleosVoice({ onRoute, onOrbStateChange, onBriefFill }) {
    const [listening, setListening] = useState(false);
    const [awake, setAwake] = useState(false);

    const awakeRef = useRef(false);
    const awakeReadyRef = useRef(false);
    const isSpeakingRef = useRef(false);
    const onRouteRef = useRef(onRoute);
    const onOrbStateChangeRef = useRef(onOrbStateChange);
    const onBriefFillRef = useRef(onBriefFill);
    const wsRef = useRef(null);
    const shouldListenRef = useRef(true);
    const recognitionRef = useRef(null);
    const unlockedRef = useRef(false);
    const conversationTimerRef = useRef(null);

    useEffect(() => { onRouteRef.current = onRoute; }, [onRoute]);
    useEffect(() => { onOrbStateChangeRef.current = onOrbStateChange; }, [onOrbStateChange]);
    useEffect(() => { onBriefFillRef.current = onBriefFill; }, [onBriefFill]);

    function setAwakeState(val) {
        awakeRef.current = val;
        setAwake(val);
    }

    // ── Audio playback ────────────────────────────────────────────────────────
    const playAudio = useCallback((base64mp3) => {
        const audioBytes = Uint8Array.from(atob(base64mp3), c => c.charCodeAt(0));
        const blob = new Blob([audioBytes], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        isSpeakingRef.current = true;

        const onDone = () => {
            isSpeakingRef.current = false;
            // Stay awake for 30s so user can reply without repeating wake word
            clearTimeout(conversationTimerRef.current);
            setAwakeState(true);
            awakeReadyRef.current = true;
            onOrbStateChangeRef.current('listening');
            conversationTimerRef.current = setTimeout(() => {
                setAwakeState(false);
                awakeReadyRef.current = false;
                onOrbStateChangeRef.current('idle');
            }, 30000);
        };

        audio.onended = () => { URL.revokeObjectURL(url); onDone(); };
        audio.onerror = () => { URL.revokeObjectURL(url); onDone(); };
        audio.play().catch(err => {
            console.error('audio play error:', err);
            isSpeakingRef.current = false;
        });
    }, []);

    // ── Unlock audio on first click, then signal backend to greet ────────────
    useEffect(() => {
        const unlock = () => {
            if (unlockedRef.current) return;
            unlockedRef.current = true;
            const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
            silent.play().catch(() => {});
            const ws = wsRef.current;
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ready' }));
            }
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

            ws.onopen = () => {
                if (unlockedRef.current) {
                    ws.send(JSON.stringify({ type: 'ready' }));
                }
            };

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);

                if (msg.type === 'state') {
                    onOrbStateChangeRef.current(msg.value);
                }
                if (msg.type === 'audio') {
                    playAudio(msg.data);
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

    // ── Send transcript to backend ────────────────────────────────────────────
    const sendTranscript = useCallback((text) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'transcript', text }));
    }, []);

    // ── Speech recognition ────────────────────────────────────────────────────
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        let active = true;
        const recognition = new SR();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = false;
        shouldListenRef.current = true;

        recognition.onstart = () => setListening(true);

        recognition.onresult = (event) => {
            if (isSpeakingRef.current) return;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (!event.results[i].isFinal) continue;

                const raw = event.results[i][0].transcript.trim();
                const text = applyCorrections(raw);
                const hasWakeWord = WAKE_WORDS.some(w => text.includes(w));

                if (hasWakeWord) {
                    const stripped = stripWakeWord(text);
                    if (stripped.length > 0) {
                        setAwakeState(false);
                        awakeReadyRef.current = false;
                        sendTranscript(stripped);
                    } else {
                        setAwakeState(true);
                        awakeReadyRef.current = true;
                        onOrbStateChangeRef.current('listening');
                    }
                } else if (awakeRef.current && awakeReadyRef.current) {
                    setAwakeState(false);
                    awakeReadyRef.current = false;
                    sendTranscript(text);
                }
            }
        };

        recognition.onerror = (e) => {
            if (e.error === 'not-allowed') {
                shouldListenRef.current = false;
                setListening(false);
            }
        };

        recognition.onend = () => {
            if (active && shouldListenRef.current) {
                setTimeout(() => { try { recognition.start(); } catch { /* ignore */ } }, 300);
            } else {
                setListening(false);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();

        return () => {
            active = false;
            shouldListenRef.current = false;
            recognition.stop();
        };
    }, [sendTranscript]);

    const stopListening = useCallback(() => {
        shouldListenRef.current = false;
        recognitionRef.current?.stop();
        setListening(false);
        onOrbStateChangeRef.current('idle');
    }, []);

    return { listening, awake, stopListening };
}
