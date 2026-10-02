FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./
COPY src ./src

USER node
EXPOSE 8090

CMD ["node", "src/index.js"]
