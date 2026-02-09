# Base Image
FROM node:18-alpine

# Working Directory
WORKDIR /app

# Install Dependencies
COPY package*.json ./
# Install production dependencies only to save space
# If you need devDependencies for build (e.g. typescript), remove --omit=dev
RUN npm install --omit=dev

# Copy Source Code
COPY . .

# Expose Port (Fly.io default is 8080)
EXPOSE 8080

# Start Command
CMD ["npm", "start"]
