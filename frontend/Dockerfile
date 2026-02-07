## Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# These are baked in at build time
ARG VITE_API_URL
ARG VITE_NEON_AUTH_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_NEON_AUTH_URL=$VITE_NEON_AUTH_URL

RUN npm run build

## Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
