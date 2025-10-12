FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN mkdir -p uploads
EXPOSE 3001
CMD ["npm", "start"]
