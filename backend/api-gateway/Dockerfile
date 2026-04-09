# Base image
FROM node:18-alpine

# Workspace
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm install --production

# Source code
COPY . .

# Environment
ENV NODE_ENV=production
EXPOSE 3000

# Start
CMD ["node", "server.js"]
