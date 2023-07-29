import { Component } from '@angular/core';
import { environment } from '../environments/environments';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  env: string = environment.name;
}
