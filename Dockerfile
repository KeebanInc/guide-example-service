FROM node:26.12.1-alpine3.24

WORKDIR /app

COPY server.js ./

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
