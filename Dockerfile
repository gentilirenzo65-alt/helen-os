
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN apt-get update -y && apt-get install -y openssl
RUN npm install

# Copy source
# Copy source
COPY . .

# Generate Prisma Client with dummy env
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start: Push schema to Supabase at runtime, then start app
CMD sh -c "npx prisma db push && npm start"
