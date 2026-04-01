from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import httpx
import os
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


class BriefRequest(BaseModel):
    text: str
    project_name: str


@app.get("/")
def health_check():
    return {"status": "Kleos backend is running"}


@app.post("/api/brief")
async def generate_brief(request: BriefRequest):
    # 1. Call Claude for design directions
    message = anthropic_client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[
            {
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
            }
        ]
    )

    import json
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    directions = json.loads(raw.strip())

    # 2. Fetch Unsplash images for each direction
    async with httpx.AsyncClient() as client:
        for direction in directions["directions"]:
            query = " ".join(direction["keywords"])
            response = await client.get(
                "https://api.unsplash.com/search/photos",
                params={"query": query, "per_page": 4, "orientation": "landscape"},
                headers={"Authorization": f"Client-ID {UNSPLASH_KEY}"}
            )
            results = response.json()
            direction["images"] = [
                {
                    "url": photo["urls"]["regular"],
                    "thumb": photo["urls"]["thumb"],
                    "credit": photo["user"]["name"],
                    "link": photo["links"]["html"]
                }
                for photo in results.get("results", [])
            ]

    return directions
