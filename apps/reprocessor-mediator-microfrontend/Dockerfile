FROM node:18 AS build

ARG NETWORK_TIMEOUT

WORKDIR /usr/app

COPY apps/reprocessor-mediator-microfrontend/ .

# RUN yarn install --check-cache

# Set Yarn network timeout
RUN yarn config set network-timeout ${NETWORK_TIMEOUT:-600000}

# Install dependencies with retries
RUN retry() {
      n=0
      until [ $n -ge 5 ]
      do
        yarn install --check-cache && break
        n=$[$n+1]
        sleep 15
      done
    }
    retry

RUN yarn run build

FROM nginx:1.23.1-alpine

COPY --from=build /usr/app/dist /usr/share/nginx/html
COPY --from=build /usr/app/config/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
