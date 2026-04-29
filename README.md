# AEGIS SIEM — Personal Security Information & Event Management System

<p align="center">
  <strong>A full-stack, containerized Security Information and Event Management (SIEM) platform built for real-time network threat detection, log analysis, and AI-assisted security operations.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Suricata-IDS-orange" />
  <img src="https://img.shields.io/badge/Elasticsearch-8.10-blue" />
  <img src="https://img.shields.io/badge/Groq-Llama%203.3-purple" />
  <img src="https://img.shields.io/badge/React-18-61DAFB" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED" />
  <img src="https://img.shields.io/badge/MITRE-ATT%26CK-red" />
</p>

---

## Overview

AEGIS SIEM is a self-hosted, production-grade security monitoring platform deployed on a cloud VM. It ingests real-time network traffic from multiple sources, processes and stores security events in Elasticsearch, and presents them through a modern React dashboard with AI-assisted threat analysis.

The system detects real threats — port scans, SQL injection attempts, XSS attacks, directory traversal, known malicious IPs from DShield and Spamhaus blocklists, and more — and maps them to the MITRE ATT&CK framework for structured threat intelligence.

---

## Features

- **Real-Time Intrusion Detection** — Suricata IDS with 49,000+ Emerging Threats rules monitoring live network traffic
- **Multi-Source Log Ingestion** — Suricata, Zeek, syslog, and Winlogbeat all flowing through a Filebeat → Logstash → Elasticsearch pipeline
- **AI Security Analyst** — Natural language interface powered by Groq (Llama 3.3-70b) that queries Elasticsearch and explains security events
- **MITRE ATT&CK Mapping** — Automatically maps detected Suricata signatures to ATT&CK tactics and techniques with links to the official framework
- **VirusTotal Integration** — One-click IP reputation lookup directly from Event Logs
- **Live Event Logs** — Searchable, filterable log viewer with protocol filtering, severity levels, and exportable CSV
- **System Health Dashboard** — Real-time CPU, memory, disk, and network metrics via Prometheus + Grafana + cAdvisor
- **Password Manager** — Secure credential storage with AES-256-GCM encryption
- **Global Search** — Unified search across pages, features, alerts, and logs
- **Automatic Log Retention** — ILM policy rolls over at 1,000 documents and deletes indices after 3 days

---

## Architecture

```
Network Traffic
      │
      ├──► Suricata IDS ──► eve.json ──┐
      │                                 ├──► Filebeat ──► Logstash ──► suricata-* / zeek-*
      ├──► Zeek ──► conn/dns/http.log ──┘
      │
      ├──► Linux rsyslog ──────────────────────────────► Logstash ──► syslog-*
      │
      └──► Windows Winlogbeat ─────────────────────────► Logstash ──► winlogbeat-*
                                                               │
                                                        Elasticsearch
                                                               │
                             ┌─────────────────────────────────┼──────────────────────┐
                             │                                  │                       │
                      React Dashboard                     AI Assistant               Kibana
                             │
                          Nginx (HTTPS)
                             │
                          Internet
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend AI | Python FastAPI, Groq API (Llama 3.3-70b) |
| IDS | Suricata 6.x + Emerging Threats Open Ruleset (49,000+ rules) |
| Network Analysis | Zeek 6.0 |
| Log Pipeline | Filebeat 8.10 → Logstash 8.10 → Elasticsearch 8.10 |
| Database | Elasticsearch 8.10 |
| Visualization | Kibana 8.10, Grafana |
| Metrics | Prometheus, Node Exporter, cAdvisor |
| Auth | Supabase Auth (JWT) |
| Reverse Proxy | Nginx (SSL/TLS) |
| Infrastructure | Cloud VM, Docker Compose |
| Threat Intel | MITRE ATT&CK Framework, VirusTotal API |

---

## Services

| Service | Description |
|---------|-------------|
| Nginx | Reverse proxy, SSL termination |
| React Dashboard | Frontend web application |
| AI Assistant | FastAPI + Groq AI backend |
| Elasticsearch | Search and storage engine |
| Logstash | Log processing pipeline |
| Filebeat | Log shipper (Suricata + Zeek) |
| Suricata IDS | Network intrusion detection |
| Zeek | Network traffic analyzer |
| Kibana | Elasticsearch visualization |
| Prometheus | Metrics collection |
| Grafana | Metrics visualization |
| Node Exporter | VM system metrics |
| cAdvisor | Container metrics |
| Password Manager | Encrypted credential storage |

---

## Prerequisites

- Docker + Docker Compose
- Linux server with 4+ GB RAM
- Domain name with SSL certificate
- Groq API key — [console.groq.com](https://console.groq.com)
- Supabase project — [supabase.com](https://supabase.com)
- VirusTotal API key — [virustotal.com](https://www.virustotal.com)

---

## Installation

**1. Clone the repository:**
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

**2. Create your environment file:**
```bash
cp .env.example .env
nano .env  # Fill in your API keys
```

**3. Create required directories:**
```bash
mkdir -p logs/suricata logs/zeek logs/pipeline
sudo chown -R $USER:$USER logs/
```

**4. Download Suricata rules:**
```bash
curl -sSL https://rules.emergingthreats.net/open/suricata-6.0/emerging.rules.tar.gz \
  -o /tmp/emerging.rules.tar.gz
tar -xzf /tmp/emerging.rules.tar.gz -C /tmp/
cp /tmp/rules/*.rules ids/rules/
```

**5. Start all services:**
```bash
docker compose up -d
```

**6. Configure rsyslog to ship system logs:**
```bash
echo '*.* @127.0.0.1:5140' | sudo tee /etc/rsyslog.d/49-logstash.conf
sudo systemctl restart rsyslog
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Groq AI
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Elasticsearch
ELASTICSEARCH_HOST=http://elasticsearch:9200

# Supabase Auth
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# VirusTotal
VITE_VIRUSTOTAL_API_KEY=your_virustotal_api_key

# Frontend
VITE_AI_ASSISTANT_URL=https://yourdomain.com/ai-assistant/
VITE_ELASTICSEARCH_URL=/elasticsearch
```

---

## Security

- All services sit behind Nginx — not directly exposed to the internet
- Supabase JWT authentication on the dashboard
- Elasticsearch restricted to internal Docker network only
- ILM log retention policy (1,000 doc rollover, 3-day auto-deletion)
- UFW firewall configured — only HTTP/HTTPS and SSH open
- `.env` files excluded from version control via `.gitignore`

---

## Attack Test Scripts

Located in `/tests/` — run from an **external machine** against your own server only:

| Script | Attack Type | Expected Alert |
|--------|-------------|---------------|
| `test1.sh` | Nmap SYN Port Scan | ET SCAN Nmap |
| `test2.sh` | SSH Brute Force | ET SCAN SSH BruteForce |
| `test3.sh` | SQL Injection | ET WEB_SPECIFIC_APPS SQL Injection |
| `test4.sh` | Directory Traversal | ET WEB_SERVER Path Traversal |
| `test5.sh` | DNS Recon + ICMP Flood | ET SCAN DNS / ICMP |

```bash
# Usage — replace with your own domain
bash tests/test1.sh yourdomain.com
```

> ⚠️ Only run these scripts against systems you own. Unauthorized use is illegal.

---

## MITRE ATT&CK Coverage

| Tactic | Technique | Triggered By |
|--------|-----------|-------------|
| Reconnaissance | T1595 — Active Scanning | Nmap, Nessus |
| Reconnaissance | T1590 — Gather Network Info | CINS threat intel IPs |
| Initial Access | T1133 — External Remote Services | DShield/Spamhaus blocklists |
| Execution | T1059.007 — JavaScript | XSS attempts |
| Credential Access | T1552 — Unsecured Credentials | .env file requests |
| Discovery | T1083 — File Discovery | /etc/passwd traversal |
| Discovery | T1018 — Remote System Discovery | ICMP ping sweeps |
| Exfiltration | T1048.003 — Unencrypted Exfil | ZIP over raw TCP |
| Resource Development | T1584 — Compromise Infrastructure | Known compromised hosts |

---

## Team

Built as a capstone security project.

> Add team member names and roles here.

---

## References

1. Bhatt, S., Manadhata, P. K., and Zomlot, L., "The Operational Role of Security Information and Event Management Systems," *IEEE Security & Privacy*, 2014, Vol. 12, No. 5, pp. 35-41.

2. Scarfone, K., and Mell, P., "Guide to Intrusion Detection and Prevention Systems (IDPS)," *NIST Special Publication 800-94*, National Institute of Standards and Technology, 2007.

3. Kent, K., and Souppaya, M., "Guide to Computer Security Log Management," *NIST Special Publication 800-92*, National Institute of Standards and Technology, 2006.

4. Merkel, D., "Docker: Lightweight Linux Containers for Consistent Development and Deployment," *Linux Journal*, 2014, Vol. 2014, No. 239.

---

## License

This project is for educational purposes only. Do not use attack test scripts against systems you do not own or without explicit permission.
