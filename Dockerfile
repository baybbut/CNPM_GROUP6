# Development/demo. SQL Server is supplied separately.
FROM node:24-bookworm-slim AS backend
WORKDIR /app/muses-backend
COPY muses-backend/package*.json ./
RUN npm ci --omit=dev
COPY muses-backend/ ./
COPY muses-react/tranh/ /app/muses-react/tranh/
COPY muses-react/background/ /app/muses-react/background/
COPY muses-react/src/data/hcmPlaces.json /app/muses-react/src/data/hcmPlaces.json
RUN chown -R node:node /app
USER node
EXPOSE 3001
CMD ["npm", "start"]

FROM node:24-bookworm-slim AS website
WORKDIR /app/muses-react
COPY muses-react/package*.json ./
RUN npm ci
COPY muses-react/ ./
RUN chown -R node:node /app/muses-react
USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]

FROM node:24-bookworm-slim AS admin
WORKDIR /app/muses-admin
COPY muses-admin/package*.json ./
RUN npm ci
COPY muses-admin/ ./
# Admin imports Narration, icons and maps from the sibling website directory.
COPY muses-react/ /app/muses-react/
RUN ln -s /app/muses-admin/node_modules /app/muses-react/node_modules \
    && chown -R node:node /app
USER node
EXPOSE 5174
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174", "--strictPort"]
