# Gear3

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Website Screenshots 

Website screenshots are not managed in version control. Instead, copy images into working directory. Copy files into `assets/website-screenshots` directory. Script creates destination directory, searches the root `websites-screenshots` folder for all `.webp` images, and sends them to `src/assets/website-screenshots`

`mkdir src/assets/website-screenshots && find website-screenshots -type f -name "*.webp" -exec cp {} src/assets/website-screenshots \;`

### Converting Images

In order to keep the image filesize small, all PNGs get converted to WEBP. The following converts a given folder and all `.png` to `.webp`. Outputs will land in the folder from which it was run. [sharp-cli](https://www.npmjs.com/package/sharp-cli)

`npx sharp-cli -f webp --input "*.png" -o .`



