FROM node:18-alpine AS build

WORKDIR /usr/app

COPY . .

RUN yarn install

RUN yarn run build

FROM nginx:1.23.1-alpine

COPY --from=build /usr/app/dist /usr/share/nginx/html
COPY --from=build /usr/app/config/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
