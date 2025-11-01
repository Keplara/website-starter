# Client

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Links
* `https://www.typescriptlang.org/`
* `https://angular.io/docs`


Build image
`docker build --rm -f ./Dockerfile -t [id].dkr.ecr.us-east-1.amazonaws.com/mysite/client .`

Run image locally
`docker run -p 80:8080 -d -t [id].dkr.ecr.us-east-1.amazonaws.com/mysite/client`

ECR login before image push
`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [id].dkr.ecr.us-east-1.amazonaws.com`

Push image
`docker push [id].dkr.ecr.us-east-1.amazonaws.com/mysite/client:latest`

Quick start 
`docker compose up -d web-dev --build`


Build image
`docker build --rm -f ./Dockerfile -t [id].dkr.ecr.us-east-1.amazonaws.com/mysite/Client .`

Run image locally
`docker run -p 80:8080 -d -t [id].dkr.ecr.us-east-1.amazonaws.com/mysite/Client`

ECR login before image push
`aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [id].dkr.ecr.us-east-1.amazonaws.com`

Push image
`docker push [id].dkr.ecr.us-east-1.amazonaws.com/mysite/client:latest`

Quick start 
`export PORT=8080`
`docker compose up -d web-dev --build`


`ng cache clean`

Test 1