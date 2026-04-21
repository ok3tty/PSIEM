#!/bin/bash
# TEST 2 - SSH Brute Force Simulation
# Expected Suricata alert: ET SCAN Potential SSH Brute Force
# Run from: anywhere (home or VM)
# Usage: sudo bash test2_sshbrute.sh [target]

TARGET=${1:-"myaegis.org"}

echo "============================================"
echo " TEST 2: SSH Brute Force"
echo " Target: $TARGET"
echo "============================================"

which hydra > /dev/null 2>&1 || { echo "Installing hydra..."; sudo apt-get install -y hydra -q; }

cat > /tmp/test_passwords.txt << 'EOF'
admin
password
123456
root
toor
qwerty
letmein
welcome
pass123
admin123
EOF

echo "[*] Running SSH brute force simulation..."
hydra -l root -P /tmp/test_passwords.txt $TARGET ssh -t 4 -f -V 2>&1 | head -40

echo ""
echo "[✓] Done! Check AEGIS SIEM Event Logs in ~30 seconds"
