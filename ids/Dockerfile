FROM ubuntu:22.04
# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies and Suricata
RUN for i in 1 2 3; do \
      apt-get update && \
      apt-get install -y --fix-missing \
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
        tcpdump \
        gnupg && \
      rm -rf /var/lib/apt/lists/* && break || \
      (echo "Attempt $i failed, retrying in 15s..." && sleep 15); \
    done

# Install Zeek from official OpenSUSE repository for Ubuntu 22.04
RUN for i in 1 2 3; do \
      curl -fsSL https://download.opensuse.org/repositories/security:zeek/xUbuntu_22.04/Release.key | \
        gpg --dearmor -o /usr/share/keyrings/zeek-archive-keyring.gpg && \
      echo "deb [signed-by=/usr/share/keyrings/zeek-archive-keyring.gpg] https://download.opensuse.org/repositories/security:zeek/xUbuntu_22.04/ /" \
        > /etc/apt/sources.list.d/zeek.list && \
      apt-get update && \
      apt-get install -y --fix-missing zeek && \
      rm -rf /var/lib/apt/lists/* && break || \
      (echo "Zeek attempt $i failed, retrying in 15s..." && sleep 15); \
    done

# Add Zeek to PATH
ENV PATH="/opt/zeek/bin:${PATH}"

# Set working directory
WORKDIR /ids

# Copy local configs or rules
COPY . .

# Create necessary directories
RUN mkdir -p /var/log/suricata /var/log/zeek

# Expose ports
EXPOSE 5044 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD test -f /var/run/suricata.pid || kill -0 1 2>/dev/null || exit 1

# Start Suricata by default
CMD ["/ids/start.sh"]
