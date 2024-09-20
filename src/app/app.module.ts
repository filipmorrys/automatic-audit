import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { AppComponent } from './app.component';
import { AuditorComponent } from './auditor/auditor.component';
import { AuthGuard } from './guard/auth.guard';
import { initializeKeycloak } from './keycloak/keycloak-init.factory';
import { HeaderComponent } from './header/header.component';
import { CirculationsComponent } from './circulations/circulations.component';
import { RouteComponent } from './route/route.component';

const routes: Routes = [
  { path: '', redirectTo: 'circulations', pathMatch: 'full' },
  { path: 'auditor', canActivate: [ AuthGuard ], component: AuditorComponent },
  { path: 'circulations', canActivate: [ AuthGuard ], component: CirculationsComponent },
  { path: 'route', canActivate: [ AuthGuard ], component: RouteComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  declarations: [
    AppComponent,
    AuditorComponent,
    HeaderComponent,
    CirculationsComponent,
    RouteComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    KeycloakAngularModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
