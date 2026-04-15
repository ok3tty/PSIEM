from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from google import genai
import os
import json
import re

load_dotenv(dotenv_path="../.env")

app = FastAPI(title="PSIEM AI Assistant", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ES_HOST = os.getenv("ELASTICSEARCH_HOST", "http://psiem_elasticsearch:9200")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite-preview")

es = Elasticsearch(ES_HOST)
client = genai.Client(api_key=GEMINI_API_KEY)

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []

class ChatResponse(BaseModel):
    reply: str
    es_results: Optional[list] = None
    query_used: Optional[dict] = None

SYSTEM_PROMPT = """
You are an expert AI security analyst assistant embedded in a PSIEM (Personal Security Information and Event Management) dashboard.

Your capabilities:
1. QUERY LOGS: Translate natural language into Elasticsearch queries to search event logs, Suricata IDS alerts, Zeek network logs, and syslog data.
2. EXPLAIN ALERTS: Explain security alerts and incidents in plain English, including severity, likely cause, and attack type.
3. RECOMMEND ACTIONS: Suggest response actions for detected threats.
4. ANSWER QUESTIONS: Answer general cybersecurity questions about threats, CVEs, and attack patterns.

Elasticsearch index patterns available:
- suricata-*
- zeek-*
- syslog-*
- winlogbeat-*
- filebeat-*

IMPORTANT:
- When a real log search is needed, return an Elasticsearch query inside a fenced block exactly like this:

'''es_query
{
  "index": "suricata-*",
  "query": {
    "match_all": {}
  },
  "size": 10
}
'''

- Only return an es_query block when a real Elasticsearch search is needed.
- For explanations and recommendations, be concise and actionable.
"""

def extract_es_query(text: str) -> Optional[dict]:
    match = re.search(r"```es_query\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None

def run_es_query(query_obj: dict) -> list:
    try:
        index = query_obj.get("index", "*")
        query = query_obj.get("query", {"match_all": {}})
        size = query_obj.get("size", 10)
        response = es.search(index=index, body={"query": query, "size": size})
        return [hit["_source"] for hit in response["hits"]["hits"]]
    except Exception as e:
        return [{"error": str(e)}]

def build_prompt(history: list, new_message: str) -> str:
    parts = [SYSTEM_PROMPT, "\nConversation history:\n"]
    for item in history:
        role = "User" if item.get("role") == "user" else "Assistant"
        parts.append(f"{role}: {item.get('content', '')}")
    parts.append(f"User: {new_message}")
    parts.append("Assistant:")
    return "\n".join(parts)

@app.get("/health")
def health_check():
    es_ok = False
    try:
        es_ok = es.ping()
    except Exception:
        pass

    return {
        "status": "ok",
        "elasticsearch": "connected" if es_ok else "unreachable",
        "ai_model": GEMINI_MODEL,
        "gemini_key_configured": bool(GEMINI_API_KEY),
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured.")

        prompt = build_prompt(request.conversation_history, request.message)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        reply_text = response.text or ""

        es_query = extract_es_query(reply_text)
        es_results = None

        if es_query:
            es_results = run_es_query(es_query)
            reply_text = re.sub(r"```es_query.*?```", "", reply_text, flags=re.DOTALL).strip()

        return ChatResponse(
            reply=reply_text,
            es_results=es_results,
            query_used=es_query,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("assistant:app", host="0.0.0.0", port=8000, reload=False)
