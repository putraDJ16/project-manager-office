FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Vite requires --host to expose to the Docker network
CMD ["npm", "run", "dev", "--", "--host"]
