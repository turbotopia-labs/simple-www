FROM node:20-alpine

WORKDIR /app
COPY . .

ENV PORT=6625
EXPOSE 6625

CMD ["node", "server.js"]
