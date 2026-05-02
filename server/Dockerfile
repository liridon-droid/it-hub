FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund --omit=dev

COPY . .

EXPOSE 3001

# Use start (not dev with --watch) in containers — the rebuilder is
# only useful when bind-mounting source on the host. docker-compose
# overrides this to "npm run dev" if you want hot reload locally.
CMD ["npm", "run", "start"]
