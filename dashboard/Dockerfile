# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm ci
# Copy source code
COPY . .
# Build arg for Vite env vars
ARG VITE_ELASTICSEARCH_URL=/elasticsearch
ARG VITE_AI_ASSISTANT_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_VIRUSTOTAL_API_KEY


ENV VITE_ELASTICSEARCH_URL=$VITE_ELASTICSEARCH_URL
ENV VITE_AI_ASSISTANT_URL=$VITE_AI_ASSISTANT_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_VIRUSTOTAL_API_KEY=$VITE_VIRUSTOTAL_API_KEY
# Fix permissions and build
RUN chmod -R +x node_modules/.bin && npm run build
# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/psiem.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
