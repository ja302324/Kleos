const BASE_URL = 'http://127.0.0.1:8000';

export async function generateDesignBrief(projectType, brief) {
    const response = await fetch(`${BASE_URL}/api/design-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_type: projectType, brief }),
    });
    if (!response.ok) throw new Error('Failed to generate mood board');
    return response.json();
}

export async function generateBrief(projectName, text) {
    const response = await fetch(`${BASE_URL}/api/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_name: projectName, text }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate brief');
    }

    return response.json();
}

export async function chatWithKleos(text) {
    const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Chat failed');
    const { reply } = await response.json();
    return reply;
}

export async function speakText(text) {
    const response = await fetch(`${BASE_URL}/api/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error('TTS failed');

    const { audio } = await response.json();
    return audio; // base64 encoded mp3
}
