# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.18.0
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm run prisma:generate

COPY . .
RUN npm run build

EXPOSE 3333
CMD ["npm", "run", "start:render"]
