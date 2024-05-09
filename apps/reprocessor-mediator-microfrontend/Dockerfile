FROM node:18 AS build

WORKDIR /usr/app

RUN ls -l

COPY apps/reprocessor-mediator-microfrontend/ .

RUN ls -l
# Install app dependencies
# COPY app/apps/reprocessor-mediator-microfrontend/package.json .

# RUN yarn install --immutable --immutable-cache --check-cache

# # RUN yarn install

# RUN yarn run build

# FROM nginx:1.23.1-alpine

# COPY --from=build /usr/app/apps/reprocessor-mediator-microfrontend/dist /usr/share/nginx/html
# COPY --from=build /usr/app/config/nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]
