#!/bin/bash
# TEST 3 - SQL Injection via HTTP
# Expected Suricata alert: ET WEB_SPECIFIC_APPS SQL Injection
# Run from: anywhere (home or VM)
# Usage: bash test3_sqli.sh [target]

TARGET=${1:-"myaegis.org"}

echo "============================================"
echo " TEST 3: SQL Injection"
echo " Target: $TARGET"
echo "============================================"

which curl > /dev/null 2>&1 || { echo "Installing curl..."; sudo apt-get install -y curl -q; }

payloads=(
  "' OR '1'='1"
  "' OR 1=1--"
  "'; DROP TABLE users;--"
  "' UNION SELECT null,null,null--"
  "admin'--"
  "1' AND SLEEP(5)--"
  "' OR 'x'='x"
  "1; SELECT * FROM users"
)

echo "[*] Sending SQL injection payloads..."
for payload in "${payloads[@]}"; do
  encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))" 2>/dev/null || echo "$payload")
  echo "  -> $payload"
  curl -sk "https://$TARGET/?id=$encoded" -o /dev/null -w "  HTTP %{http_code}\n"
  curl -sk "https://$TARGET/login?user=$encoded&pass=test" -o /dev/null -w "  HTTP %{http_code}\n"
  sleep 0.5
done

echo ""
echo "[✓] Done! Check AEGIS SIEM Event Logs in ~30 seconds"
