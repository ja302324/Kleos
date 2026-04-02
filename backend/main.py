from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import asyncio
import httpx
import base64
import json
import re
import os
import time
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
UNSPLASH_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
PINTEREST_APP_ID = os.getenv("PINTEREST_APP_ID")
PINTEREST_APP_SECRET = os.getenv("PINTEREST_APP_SECRET")
PEXELS_KEY = os.getenv("PEXELS_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = "sB7vwSCyX0tQmU24cW2C"

# Pinterest app-level token cache
_pinterest_token: str | None = None
_pinterest_token_expiry: float = 0.0


async def get_pinterest_token() -> str | None:
    global _pinterest_token, _pinterest_token_expiry
    if not PINTEREST_APP_ID or not PINTEREST_APP_SECRET:
        return None
    if _pinterest_token and time.time() < _pinterest_token_expiry - 60:
        return _pinterest_token
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            "https://api.pinterest.com/v5/oauth/token",
            data={"grant_type": "client_credentials"},
            auth=(PINTEREST_APP_ID, PINTEREST_APP_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            print(f"Pinterest auth error {resp.status_code}: {resp.text}")
            return None
        body = resp.json()
        _pinterest_token = body.get("access_token")
        _pinterest_token_expiry = time.time() + body.get("expires_in", 2592000)
        return _pinterest_token

KLEOS_SYSTEM_PROMPT = """You are Kleos, a confident and concise AI design companion — like Jarvis but for designers.
You help designers with creative briefs, visual direction, color palettes, typography, and design strategy.
Respond in 1-2 short sentences. Be direct, warm, and sharp. No bullet points, no markdown, no lists.
Never say you're an AI. Just be Kleos.

If the user describes a design project or brief (mentioning a client, product, brand, style, audience, or creative goal):
- Extract a project type (e.g. Brand Identity, UI Design, Packaging) and a brief description from what they said.
- End your response with [ACTION:brief][NAME:project type here][BRIEF:brief description here]
- Example: user says "I need a brand for a coffee shop in Brooklyn, warm and rustic" →
  reply: "Love that direction — warm textures and earthy tones will nail it. Let me build the mood board." [ACTION:brief][NAME:Brand Identity][BRIEF:A warm, rustic brand identity for a Brooklyn coffee shop. Earthy tones, artisanal feel.]

If the user just wants to open the brief form without describing a brief — end with [ACTION:brief] only.
If they want to see their saved projects or library — end with [ACTION:projects].
If they want to go home or to the dashboard — end with [ACTION:home].
Strip ALL tags before speaking the response aloud."""

ROUTING_COMMANDS = [
    {"patterns": ["home", "go home", "dashboard"], "section": "home"},
    {"patterns": ["new brief", "create brief", "start brief", "brief"], "section": "brief"},
    {"patterns": ["projects", "library", "my projects", "take me to projects", "project"], "section": "projects"},
    {"patterns": ["settings", "account"], "section": "settings"},
]


class BriefRequest(BaseModel):
    text: str
    project_name: str

class DesignBriefRequest(BaseModel):
    brief: str
    project_type: str = ""


CREATIVE_DIRECTOR_PROMPT = """You are the creative intelligence behind Kleos — a senior creative director and design strategist with 20 years of experience across branding, editorial, digital product, and spatial design.

When given a design brief, analyze it deeply and return a structured creative direction. Be specific and opinionated — not generic.

Return ONLY valid JSON (no markdown, no extra text) in this exact structure:
{
  "visual_direction": "2-3 sentences describing the overall visual feel, tone, and creative approach",
  "tone": "2-4 words (e.g. Bold, cerebral, understated)",
  "aesthetic": "Name of the aesthetic direction (e.g. New Luxury Minimalism)",
  "design_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "color_palette": [
    { "hex": "#HEXCODE", "mood": "one word" },
    { "hex": "#HEXCODE", "mood": "one word" },
    { "hex": "#HEXCODE", "mood": "one word" },
    { "hex": "#HEXCODE", "mood": "one word" },
    { "hex": "#HEXCODE", "mood": "one word" }
  ],
  "typography": {
    "heading": { "font": "Font Name", "style": "e.g. Condensed Bold", "rationale": "one sentence" },
    "body": { "font": "Font Name", "style": "e.g. Regular 16/24", "rationale": "one sentence" }
  },
  "pinterest_suggestions": [
    { "label": "Search label", "url": "https://pinterest.com/search/pins/?q=url+encoded+query", "reason": "one sentence" },
    { "label": "Search label", "url": "https://pinterest.com/search/pins/?q=url+encoded+query", "reason": "one sentence" },
    { "label": "Search label", "url": "https://pinterest.com/search/pins/?q=url+encoded+query", "reason": "one sentence" },
    { "label": "Search label", "url": "https://pinterest.com/search/pins/?q=url+encoded+query", "reason": "one sentence" },
    { "label": "Search label", "url": "https://pinterest.com/search/pins/?q=url+encoded+query", "reason": "one sentence" }
  ]
}"""


# ─── Mood board API helpers ───────────────────────────────────────────────────

async def fetch_colormind_palette() -> list:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("http://colormind.io/api/", json={"model": "default"})
            if resp.status_code == 200:
                return [f"#{r:02x}{g:02x}{b:02x}" for r, g, b in resp.json().get("result", [])]
    except Exception as e:
        print(f"Colormind error: {e}")
    return []


async def enrich_color(hex_code: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(f"https://www.thecolorapi.com/id?hex={hex_code.lstrip('#')}")
            data = resp.json()
            return {"name": data["name"]["value"], "hex": hex_code}
    except Exception as e:
        print(f"Color API error for {hex_code}: {e}")
    return {"name": "", "hex": hex_code}


async def fetch_pexels_images(keywords: list) -> list:
    if not PEXELS_KEY:
        return []
    query = " ".join(keywords[:3])
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.pexels.com/v1/search",
                params={"query": query, "per_page": 9, "orientation": "landscape"},
                headers={"Authorization": PEXELS_KEY},
            )
            return [
                {
                    "url": p["src"]["medium"],
                    "thumb": p["src"]["small"],
                    "full": p["src"]["large2x"],
                    "credit": p["photographer"],
                    "credit_url": p["photographer_url"],
                    "link": p["url"],
                    "platform": "Pexels",
                }
                for p in resp.json().get("photos", [])
            ]
    except Exception as e:
        print(f"Pexels error: {e}")
    return []


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def synthesize(text: str) -> str:
    """Call ElevenLabs and return base64 MP3."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}",
            headers={"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"},
            json={
                "text": text,
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
        )
        if response.status_code != 200:
            print(f"ElevenLabs error {response.status_code}: {response.text}")
            return None
        return base64.b64encode(response.content).decode()


def detect_route(text: str):
    lower = text.lower()
    for cmd in ROUTING_COMMANDS:
        if any(p in lower for p in cmd["patterns"]):
            return cmd["section"]
    return None


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "Kleos backend is running"}


# ─── WebSocket voice endpoint ─────────────────────────────────────────────────

@app.websocket("/ws/voice")
async def voice_handler(ws: WebSocket):
    await ws.accept()
    conversation_history = []

    try:
        while True:
            raw = await ws.receive_text()
            message = json.loads(raw)

            if message.get("type") == "ready":
                # User has interacted — safe to play audio now
                await ws.send_json({"type": "state", "value": "speaking"})
                audio = await synthesize("Kleos online. I'm listening.")
                if audio:
                    await ws.send_json({"type": "audio", "data": audio})
                await ws.send_json({"type": "state", "value": "idle"})
                continue

            if message.get("type") != "transcript":
                continue

            transcript = message["text"].strip()
            if not transcript:
                continue

            # Check for routing command first (no Claude needed)
            section = detect_route(transcript)
            if section:
                await ws.send_json({"type": "state", "value": "speaking"})
                audio = await synthesize(f"Sure, taking you to {section}.")
                if audio:
                    await ws.send_json({"type": "audio", "data": audio})
                await ws.send_json({"type": "route", "section": section})
                await ws.send_json({"type": "state", "value": "idle"})
                continue

            # Conversational response via Claude
            await ws.send_json({"type": "state", "value": "thinking"})

            conversation_history.append({"role": "user", "content": transcript})

            # Keep last 10 turns to avoid token bloat
            recent = conversation_history[-10:]

            try:
                result = anthropic_client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=150,
                    system=KLEOS_SYSTEM_PROMPT,
                    messages=recent,
                )
                reply = result.content[0].text.strip()
            except Exception as e:
                print(f"Claude error: {e}")
                reply = "Sorry, I ran into an issue. Try again."

            # Extract structured tags
            action_match = re.search(r'\[ACTION:(\w+)\]', reply)
            name_match   = re.search(r'\[NAME:([^\]]+)\]', reply)
            brief_match  = re.search(r'\[BRIEF:([^\]]+)\]', reply)
            clean_reply  = re.sub(r'\[(ACTION|NAME|BRIEF):[^\]]+\]', '', reply).strip()

            conversation_history.append({"role": "assistant", "content": clean_reply})

            await ws.send_json({"type": "state", "value": "speaking"})
            audio = await synthesize(clean_reply)
            if audio:
                await ws.send_json({"type": "audio", "data": audio})
            if action_match:
                section = action_match.group(1).lower()
                await ws.send_json({"type": "route", "section": section})
                # If brief intent includes extracted content, auto-fill the form
                if section == "brief" and name_match and brief_match:
                    await ws.send_json({
                        "type": "brief_fill",
                        "projectName": name_match.group(1).strip(),
                        "briefText": brief_match.group(1).strip(),
                    })
            await ws.send_json({"type": "state", "value": "idle"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")


# ─── Design Brief / Mood Board endpoint ──────────────────────────────────────

@app.post("/api/design-brief")
async def design_brief(request: DesignBriefRequest):
    prompt = f"Project Type: {request.project_type}\nBrief: {request.brief}" if request.project_type else f"Brief: {request.brief}"

    result = anthropic_client.messages.create(
        model="claude-opus-4-6",
        max_tokens=2048,
        system=CREATIVE_DIRECTOR_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = result.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    mood_board = json.loads(raw.strip())

    palette = mood_board.get("color_palette", [])
    keywords = mood_board.get("design_keywords", [])

    # All external calls in parallel
    results = await asyncio.gather(
        fetch_colormind_palette(),
        fetch_pexels_images(keywords),
        *[enrich_color(c["hex"]) for c in palette],
    )

    mood_board["colormind_palette"] = results[0]
    mood_board["images"] = results[1]
    enriched = results[2:]
    for i, color in enumerate(palette):
        if i < len(enriched):
            color["name"] = enriched[i].get("name", "")

    return mood_board


# ─── Brief endpoint (legacy) ──────────────────────────────────────────────────

@app.post("/api/brief")
async def generate_brief(request: BriefRequest):
    message = anthropic_client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""You are Kleos, an AI design companion. A designer has submitted this creative brief:

Project: {request.project_name}
Brief: {request.text}

Respond with 3 distinct design directions. For each direction provide:
- A short name (2-4 words)
- A one sentence description of the visual style
- 3 keywords to search for inspiration images

Format your response as JSON like this:
{{
  "directions": [
    {{
      "name": "Direction name",
      "description": "Visual style description",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }}
  ]
}}"""
        }]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    directions = json.loads(raw.strip())

    async with httpx.AsyncClient() as client:
        for direction in directions["directions"]:
            query = " ".join(direction["keywords"])
            images = []

            # Pinterest — design inspiration (preferred when credentials are set)
            pinterest_token = await get_pinterest_token()
            if pinterest_token:
                try:
                    pins_resp = await client.get(
                        "https://api.pinterest.com/v5/search/partner/pins",
                        params={"term": query, "country_code": "US", "limit": 3},
                        headers={"Authorization": f"Bearer {pinterest_token}"},
                    )
                    for pin in pins_resp.json().get("items", []):
                        media = pin.get("media", {})
                        img_sizes = media.get("images", {})
                        thumb_url = (
                            img_sizes.get("400x300", {}).get("url")
                            or img_sizes.get("150x150", {}).get("url")
                        )
                        full_url = img_sizes.get("1200x", {}).get("url") or thumb_url
                        creator = pin.get("board_owner", {})
                        if thumb_url:
                            images.append({
                                "url": full_url,
                                "thumb": thumb_url,
                                "title": pin.get("title") or pin.get("description", ""),
                                "credit": creator.get("username", "Unknown"),
                                "credit_url": f"https://www.pinterest.com/{creator.get('username', '')}/",
                                "link": f"https://www.pinterest.com/pin/{pin.get('id', '')}/",
                                "platform": "Pinterest",
                            })
                except Exception as e:
                    print(f"Pinterest error: {e}")

            # Unsplash — fill remaining slots (up to 4 total)
            remaining = 4 - len(images)
            if remaining > 0 and UNSPLASH_KEY:
                try:
                    uns = await client.get(
                        "https://api.unsplash.com/search/photos",
                        params={"query": query, "per_page": remaining, "orientation": "landscape"},
                        headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"},
                    )
                    for photo in uns.json().get("results", []):
                        images.append({
                            "url": photo["urls"]["regular"],
                            "thumb": photo["urls"]["thumb"],
                            "title": photo.get("description") or photo.get("alt_description", ""),
                            "credit": photo["user"]["name"],
                            "credit_url": photo["user"]["links"]["html"],
                            "link": photo["links"]["html"],
                            "platform": "Unsplash",
                        })
                except Exception as e:
                    print(f"Unsplash error: {e}")

            direction["images"] = images

    return directions
