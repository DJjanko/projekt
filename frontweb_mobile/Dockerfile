FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Metro port for React Native CLI
EXPOSE 8081

