#!/bin/bash
# TEST 1 - Port Scan (Nmap SYN Scan)
# Expected Suricata alert: ET SCAN Nmap / SCAN SYN
# Run from: anywhere (home or VM)
# Usage: sudo bash test1_portscan.sh [target]

TARGET=${1:-"myaegis.org"}

echo "============================================"
echo " TEST 1: Port Scan"
echo " Target: $TARGET"
echo "============================================"

which nmap > /dev/null 2>&1 || { echo "Installing nmap..."; sudo apt-get install -y nmap -q; }

echo "[*] Running SYN scan on common ports..."
nmap -sS -p 22,80,443,3306,5432,6379,8080,8443,9200,27017 $TARGET

echo ""
echo "[✓] Done! Check AEGIS SIEM Event Logs in ~30 seconds"
