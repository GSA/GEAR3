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

## Creating New Views and Detail Modals

This assumes APIs have been created in express already

### Scaffold Components

#### Create View Component

Navigate to parent folder for the view (in this case, enterperise)

```sh
cd src/app/views/enterprise
ng generate component myComponent
```

#### Create Modal Component

Navigate to modals folder

```
cd src/app/components/modals
ng generate component myComponent-modal
```

Add component reference to Modal Service (`modals.service.ts`)

```ts
private myComponentSource = new Subject();
currentMyComponent = this.myComponentSource.asObservable();
```

Add component to `updateDetails` method

```ts
 else if (component == 'myComponent') {
   this.myComponentSource.next(row);
 }
```

### Additional Updates

#### Application Plumbing
- Update App Routing (app-routing.module.ts)
  - Add the View component as an import in app-routing.module.ts
    - `import {myComponent} from './views/enterprise/myComponentName.myComponent.component';`
  - Create objects in the routes array to serve the View at URL paths
    - `{ path: 'myComponentPath', component: myComponent},`
    - `{ path: 'myComponentPath/:myComponentId', component: myComponent},`
- Update App Module (app.module.ts)
  - Import View and Modal components
    - `import { myComponent} from './views/enterprise/serviceCategory/serviceCategory.component';`
    - `import { myComponent-modal } from './components/modals/myComponent-modal/service-category-modal.component';`
  - Add imported modules to `@NgModule({declarations:[]}`

#### Table Service 

- Add public method to handle row click
```ts
public myComponentTableClick(data: any, addRoute: boolean=true) {
  var options: ClickOptions = {
    data: data,
    dataID: 'id', // data attribute to use in URL 
    update: 'myComponent', // corresponds to value in modals service component
    detailModalID: '#myComponentDetail', // corresponds to the div id in the modal component
    sysTableID: '',
    exportName: data.Name + '',
    systemApiStr: '/api/myComponent/get/',  // corresponding api path
    addRoute: addRoute
  };
  this.clickMethod(options);    
}
```

#### Navigation
- Open `sidenav.component.html` and add link pointing at the route established earlier
  - `<a routerLink="/myComponentPath" >My Component List</a>`

#### API Connection 

- Update API Service (api.service.ts)
  - `import { myComponent } from '@api/models/myComponent.model';`
  - add new API path to `ApiService` class as an attribute
    - `myComponentUrl: string = this.sharedService.internalURLFmt('api/myComponent');`
  - Add new publicly available methods for each API operation 

```ts
    public getMyComponent(): Observable<MyComponent[]> {
      return this.http.get<MyComponent[]>(this.myComponentUrl).pipe(
        catchError(this.handleError<MyComponent[]>('GET MyComponent', []))
      );
    };
    public getOneMyComponent(id: number): Observable<MyComponent[]> {
      return this.http.get<MyComponent[]>(this.myComponentUrl + '/get/' + String(id)).pipe(
        catchError(this.handleError<MyComponent[]>('GET One MyComponent ', []))
      );
    };
```
