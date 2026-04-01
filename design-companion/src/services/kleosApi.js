const BASE_URL = 'http://127.0.0.1:8000';

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
