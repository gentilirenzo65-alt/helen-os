FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN apt-get update -y && apt-get install -y openssl
RUN npm install

# Copy source
COPY . .

# Accept build args and set env
ARG DATABASE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start: Push schema to Supabase at runtime, then start app
CMD ["sh", "-c", "npx prisma db push && npm start"]
