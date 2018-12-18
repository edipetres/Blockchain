FROM node:8

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . /usr/src/app

# ENV NODE_PORT 5000

# EXPOSE 5000

# RUN 'echo ${NODE_PORT}'

ENTRYPOINT [ "node", "src/app.js" ]

# CMD [ "node", "src/app.js", "localhost:$NODE_PORT" ]