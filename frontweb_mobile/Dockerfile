# frontend_mobile/Dockerfile

FROM node:18

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the full app
COPY . .

# Expose Expo Metro bundler default port
EXPOSE 8081

# Start with your existing npm start script
CMD ["npm", "start"]
