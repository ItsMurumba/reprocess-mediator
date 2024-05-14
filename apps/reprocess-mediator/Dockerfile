FROM node:18

ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

COPY apps/reprocess-mediator/ .

RUN yarn install --immutable --immutable-cache --check-cache

EXPOSE 3000
CMD [ "node", "app.mjs" ]
