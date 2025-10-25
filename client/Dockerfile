FROM node:22

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN npm install -g @angular/cli@17.3.7

RUN ng build --configuration=production

CMD ["npm","run", "serve:ssr:MySite"]
