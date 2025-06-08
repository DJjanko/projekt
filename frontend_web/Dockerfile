# frontend_web/Dockerfile

FROM node:18

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy rest of app
COPY . .

# Expose the React dev server port
EXPOSE 3000

# Start React app in development mode
CMD ["npm", "start"]
