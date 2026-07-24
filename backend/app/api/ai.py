"""
AI Router — proxies AI text rewrites to Gemini API using GEMINI_API_KEY from backend/.env.
Keeps API keys secure on the backend server.
"""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI"])


class RewriteRequest(BaseModel):
    prompt: str


@router.post("/rewrite")
async def rewrite_text(req: RewriteRequest):
    """
    Rewrite text using Gemini API with key from backend/.env.
    """
    key = settings.GEMINI_API_KEY
    if not key:
        raise HTTPException(
            status_code=400,
            detail="GEMINI_API_KEY is missing from backend/.env. Please add your key to backend/.env",
        )

    model = settings.GEMINI_PRIMARY_MODEL or "gemini-2.0-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

    body = {
        "contents": [{"parts": [{"text": req.prompt}]}],
        "generationConfig": {"maxOutputTokens": 300, "temperature": 0.9},
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=body, timeout=15.0)
            if res.status_code != 200:
                err_text = res.json().get("error", {}).get("message", res.text)
                raise HTTPException(status_code=res.status_code, detail=f"Gemini API error: {err_text}")
            data = res.json()
            text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            return {"result": text.strip()}
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Network error connecting to Gemini: {str(e)}")
