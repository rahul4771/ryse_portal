FROM node:16-slim

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV=development

RUN npm install

COPY . ./

CMD [ "npm", "start" ]