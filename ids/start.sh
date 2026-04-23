#!/bin/bash
set -e

# Auto-detect the first non-loopback interface
IFACE=$(cat /proc/net/dev | awk 'NR>2{print $1}' | tr -d ':' | grep -v lo | head -1)
echo "Detected interface: $IFACE"

if [ -z "$IFACE" ]; then
  echo "ERROR: No network interface found"
  exit 1
fi

# Create Zeek log directory
mkdir -p /var/log/zeek/live

# Start Zeek with log output to correct directory
echo "Starting Zeek on $IFACE..."
cd /var/log/zeek/live && zeek -i "$IFACE" /opt/zeek/share/zeek/site/local.zeek &

echo "Starting Suricata on $IFACE..."
exec suricata -c /etc/suricata/suricata.yaml -i "$IFACE" -v
