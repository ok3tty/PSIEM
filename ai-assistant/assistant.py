from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from elasticsearch import Elasticsearch
from groq import Groq
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
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

es = Elasticsearch(ES_HOST)
client = Groq(api_key=GROQ_API_KEY)

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []

class ChatResponse(BaseModel):
    reply: str
    es_results: Optional[list] = None
    query_used: Optional[dict] = None

SYSTEM_PROMPT = """
You are an expert AI security analyst assistant embedded in a PSIEM (Personal Security Information and Event Management) dashboard called AEGIS SIEM.

Your capabilities:
1. QUERY LOGS: Translate natural language into Elasticsearch queries to search event logs, Suricata IDS alerts, Zeek network logs, and syslog data.
2. EXPLAIN ALERTS: Explain security alerts and incidents in plain English, including severity, likely cause, and attack type.
3. RECOMMEND ACTIONS: Suggest response actions for detected threats.
4. ANSWER QUESTIONS: Answer general cybersecurity questions about threats, CVEs, and attack patterns.
5. METRICS GUIDANCE: For CPU, memory, disk, network usage questions — direct users to Grafana or the System Health page.

Elasticsearch index patterns available:
- suricata-* (Suricata IDS alerts — network intrusion detection, signature-based)
- syslog-* (System logs — auth, kernel, daemon, SSH login events)
- zeek-* (Zeek network logs — connections, DNS queries, HTTP requests, SSH sessions)
- winlogbeat-* (Windows event logs — login events, process creation, security events)

Field reference:
- suricata: alert.signature, alert.severity, alert.category, src_ip, dest_ip, proto
- syslog: syslog_message, syslog_program, syslog_hostname
- zeek: id.orig_h, id.resp_h, id.resp_p, proto, service, conn_state, ts
- winlogbeat: event.action, user.name, host.name, winlog.event_id

IMPORTANT:
- When a real log search is needed, return an Elasticsearch query inside a fenced block exactly like this:

```es_query
{
  "index": "suricata-*",
  "query": {
    "match_all": {}
  },
  "size": 10
}
```

- Use the correct index based on what the user is asking:
  * Security alerts/IDS/network threats → suricata-*
  * Failed logins/auth/system events → syslog-*
  * Network connections/DNS/HTTP traffic → zeek-*
  * Windows events/logins/processes → winlogbeat-*
- Only return an es_query block when a real Elasticsearch search is needed.
- For CPU, memory, disk, or network metrics — do NOT generate an es_query. Instead tell the user to check Grafana at https://myaegis.org/grafana or the System Health page.
- For explanations and recommendations, be concise and actionable.
- Never query an index that does not exist.
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
        print(f"Running ES query on index: {index}, query: {json.dumps(query)}")
        if not es.indices.exists(index=index):
            return [{"error": f"Index '{index}' does not exist yet. No data has been ingested for this source."}]
        response = es.search(index=index, query=query, size=size)
        return [hit["_source"] for hit in response["hits"]["hits"]]
    except Exception as e:
        print(f"ES query error: {str(e)}")
        return [{"error": str(e)}]

def build_messages(history: list, new_message: str) -> list:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history:
        messages.append({
            "role": item.get("role", "user"),
            "content": item.get("content", "")
        })
    messages.append({"role": "user", "content": new_message})
    return messages

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
        "ai_model": GROQ_MODEL,
        "groq_key_configured": bool(GROQ_API_KEY),
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not GROQ_API_KEY:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
        messages = build_messages(request.conversation_history, request.message)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=1000,
        )
        reply_text = response.choices[0].message.content or ""
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
