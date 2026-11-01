# Use official Node 24 slim image for fast container startup on Google Cloud Run
FROM node:24-slim

# Set container working directory
WORKDIR /app

# Install dependencies including codegen tooling
COPY package*.json ./
RUN npm ci

# Copy contracts, database schemas, scripts, application code, and static assets
COPY tsconfig.json openapi.yaml ./
COPY sql/ ./sql/
COPY scripts/ ./scripts/
COPY src/ ./src/
COPY public/ ./public/
COPY skill/ ./skill/

# Execute schema, query, and MCP tool generators
RUN npm run gen

# Set production environment variables
ENV NODE_ENV=production \
	PORT=8080

# Expose default Cloud Run HTTP port
EXPOSE 8080

# Start BrewMesh using Node 24 native TypeScript execution
CMD ["node", "./src/server.ts"]
