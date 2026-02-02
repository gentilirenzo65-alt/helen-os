
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN apt-get update -y && apt-get install -y openssl
RUN npm install

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Create DB for build
RUN rm -f dev.db && npx prisma db push

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
