FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run get-airports
RUN npm run get-runways
EXPOSE 4600
CMD [ "node", "./src/server.js" ]