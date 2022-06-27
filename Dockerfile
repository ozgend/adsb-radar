FROM node:16-alpine
RUN apk add --update curl && \
    rm -rf /var/cache/apk/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir ./data
RUN npm run get-airports
RUN npm run get-runways
EXPOSE 4600
CMD [ "node", "./src/server.js" ]