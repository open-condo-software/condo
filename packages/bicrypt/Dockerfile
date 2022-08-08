FROM node:14
WORKDIR /usr/src/app

COPY . .
COPY .env .env

RUN yarn

EXPOSE 7777

CMD [ "node", "server.js" ]