FROM node:18-alpine

ENV NODE_ENV production

# Create app directory
WORKDIR /usr/src/app

COPY apps/reprocess-mediator/. .
# COPY . .

# Install app dependencies
# COPY package.json ./
# COPY ../../yarn.lock ./

RUN yarn install --immutable --immutable-cache --check-cache

RUN ls -l

RUN pwd

RUN cat yarn.lock

# Bundle app source
# COPY . .

EXPOSE 3000
CMD [ "node", "app.mjs" ]
