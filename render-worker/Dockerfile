# it-hub render worker. Playwright's official image already bundles Chromium and
# all the system libs it needs, so we just add our deps + script. Keep the image
# tag pinned to the same Playwright version as package.json so the bundled
# browser matches the client library.
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./

ENV NODE_ENV=production
CMD ["node", "index.js"]
