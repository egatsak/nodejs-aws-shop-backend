FROM node:20-alpine as default
WORKDIR /app

FROM default as dev
RUN mkdir -p /tmp/devdeps
COPY package*.json /tmp/devdeps
WORKDIR /tmp/devdeps
RUN npm ci 

FROM default as prod
RUN mkdir -p /tmp/proddeps 
COPY package*.json /tmp/proddeps
WORKDIR /tmp/proddeps
RUN npm ci --omit=dev

# Build stage
FROM default AS build
COPY --from=dev /tmp/devdeps/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM default AS final
WORKDIR /app
COPY --from=prod /tmp/proddeps/node_modules node_modules
COPY --from=build /app/package.json .
COPY --from=build /app/dist dist

CMD ["node", "dist/main.js"]