FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies and Suricata
RUN apt-get update && \
    apt-get install -y \
    suricata \
    curl \
    wget \
    git \
    build-essential \
    cmake \
    libssl-dev \
    libpcap-dev \
    python3 \
    python3-pip \
    net-tools \
    tcpdump && \
    rm -rf /var/lib/apt/lists/*

# Install Zeek from Ubuntu repositories (simpler alternative)
# Note: This installs an older version but is more reliable
RUN apt-get update && \
    apt-get install -y zeek || \
    (echo "Zeek installation from repos failed, trying alternative method" && \
     apt-get install -y software-properties-common && \
     add-apt-repository ppa:oisf/suricata-stable -y && \
     apt-get update) && \
    rm -rf /var/lib/apt/lists/*

# Add Zeek to PATH if installed
ENV PATH="/opt/zeek/bin:${PATH}"

# Set working directory
WORKDIR /ids

# Copy local configs or rules
COPY . .

# Create necessary directories
RUN mkdir -p /var/log/suricata /var/log/zeek

# Expose ports
# 5044 - Logstash/Filebeat
# 8080 - Potential web interface
EXPOSE 5044 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD test -f /var/run/suricata.pid || kill -0 1 2>/dev/null || exit 1

# Start Suricata by default
CMD ["suricata", "-c", "/etc/suricata/suricata.yaml", "-i", "eth0", "-v"]
