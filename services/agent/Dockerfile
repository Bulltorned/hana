FROM node:22-alpine

# Install OpenClaw globally
RUN npm install -g openclaw

# Working directory = workspace per tenant
WORKDIR /workspace

# Skills are mounted as volume during provisioning
# Config (openclaw.json) is generated during provisioning

ENV OPENCLAW_HOME=/workspace
ENV OPENCLAW_STATE_DIR=/workspace/.openclaw/state
ENV OPENCLAW_CONFIG_PATH=/workspace/.openclaw/openclaw.json

# Gateway port (internal only — not exposed to public)
EXPOSE 18789

CMD ["openclaw", "gateway", "--port", "18789"]
