import { Component } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <button class="px-4 py-2 bg-blue-600 text-white rounded" (click)="signIn()">
        Sign in with Keycloak
      </button>
    </div>
  `,
})
export class LoginComponent {
  constructor(private auth: AuthService) {}
  signIn() { this.auth.login(); }
}