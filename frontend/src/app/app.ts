import { ThemeService } from './services/theme/theme.service';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: ` <router-outlet></router-outlet> `,
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.theme.init();
    if (this.auth.isAuthenticated()) {
      const target = this.auth.consumePostLoginRedirect();
      if (target && target !== this.router.url) {
        this.router.navigateByUrl(target);
      }
    }
  }
}
