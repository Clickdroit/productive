FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/

EXPOSE 3003

CMD ["node", "src/index.js"]