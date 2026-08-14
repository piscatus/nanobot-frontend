# Stage 1: Build environment
FROM node:20 AS build

# Set the working directory in the build container to /app
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the container
COPY package*.json ./

# Install the application dependencies inside the container
RUN npm ci

# Bundle the application source code inside the container
COPY . .

# Stage 2: Runtime environment
FROM node:20-slim

# Set the working directory in the runtime container to /app
WORKDIR /app

# Copy only the necessary files from the build container
COPY --from=build /app /app

# Start the application
CMD ["node", "index.js"]
