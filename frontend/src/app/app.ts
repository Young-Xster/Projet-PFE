import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBarNavigation } from './components/sideNavigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SideBarNavigation],
  template: `
    <side-bar-navigation></side-bar-navigation>
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
}
