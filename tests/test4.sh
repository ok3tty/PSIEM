#!/bin/bash
# TEST 4 - Directory Traversal / Web Scanner
# Expected Suricata alert: ET WEB_SERVER Path Traversal / ET SCAN Nikto
# Run from: anywhere (home or VM)
# Usage: bash test4_traversal.sh [target]

TARGET=${1:-"myaegis.org"}

echo "============================================"
echo " TEST 4: Directory Traversal & Web Scan"
echo " Target: $TARGET"
echo "============================================"

which curl > /dev/null 2>&1 || { echo "Installing curl..."; sudo apt-get install -y curl -q; }

paths=(
  "/../../../etc/passwd"
  "/..%2F..%2F..%2Fetc%2Fpasswd"
  "/.env"
  "/.git/config"
  "/wp-admin/"
  "/phpmyadmin/"
  "/admin/config.php"
  "/etc/passwd"
  "/proc/self/environ"
  "/admin/"
  "/backup/"
  "/config.php"
  "/.htaccess"
  "/server-status"
  "/actuator/env"
)

echo "[*] Probing paths with traversal payloads..."
for path in "${paths[@]}"; do
  echo "  -> $path"
  curl -sk "https://$TARGET$path" -o /dev/null \
    -A "Mozilla/5.0 Nikto/2.1.6" \
    -w "  HTTP %{http_code}\n"
  sleep 0.3
done

# Run nikto if available
if which nikto > /dev/null 2>&1; then
  echo ""
  echo "[*] Running Nikto scan (30s max)..."
  nikto -h "https://$TARGET" -maxtime 30s 2>&1 | tail -20
fi

echo ""
echo "[✓] Done! Check AEGIS SIEM Event Logs in ~30 seconds"
