#!/bin/bash
# TEST 5 - DNS Recon + ICMP Flood
# Expected Suricata alert: ET SCAN DNS / ET INFO DNS Lookup / ICMP flood
# Run from: anywhere (home or VM)
# Usage: sudo bash test5_recon.sh [target]

TARGET=${1:-"myaegis.org"}

echo "============================================"
echo " TEST 5: DNS Recon + ICMP Flood"
echo " Target: $TARGET"
echo "============================================"

which dig > /dev/null 2>&1 || { echo "Installing dnsutils..."; sudo apt-get install -y dnsutils -q; }

domains=(
  "myaegis.org"
  "google.com"
  "shodan.io"
  "exploit-db.com"
  "pastebin.com"
  "metasploit.com"
  "raw.githubusercontent.com"
  "kali.org"
)

echo "[*] Simulating DNS recon..."
for domain in "${domains[@]}"; do
  echo "  -> Querying $domain"
  dig $domain ANY +short 2>/dev/null || true
  dig $domain MX +short 2>/dev/null || true
  sleep 0.2
done

echo ""
echo "[*] Sending ICMP flood to $TARGET (10 seconds)..."
if [ "$EUID" -eq 0 ]; then
  timeout 10 ping -f $TARGET 2>/dev/null || ping -c 200 -i 0.05 $TARGET > /dev/null 2>&1
else
  echo "  (Not root — using regular ping instead of flood)"
  ping -c 50 -i 0.1 $TARGET > /dev/null 2>&1
fi

echo ""
echo "[✓] Done! Check AEGIS SIEM Event Logs in ~30 seconds"
