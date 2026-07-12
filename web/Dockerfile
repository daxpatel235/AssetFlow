# --- Next.js full-stack app (App Router + Prisma) ---
FROM node:20-alpine
WORKDIR /app

# Prisma's query engine needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

# A build-time value is required for the strict env check; override at runtime.
ENV JWT_SECRET=build_time_placeholder_secret
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Apply migrations then start. (For first run use `db push`; switch to
# `prisma migrate deploy` once you commit migrations.)
CMD ["sh", "-c", "npx prisma migrate deploy || npx prisma db push; node node_modules/next/dist/bin/next start"]
