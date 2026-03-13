import {DOCUMENT , isPlatformBrowser} from '@angular/common';
import {Inject , Injectable , PLATFORM_ID , signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({providedIn: 'root'})
export class ThemeService {
  readonly mode = signal<ThemeMode>('light');

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
  ){}

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next: ThemeMode = saved ?? (prefersDark ? 'dark' : 'light');
    this.setTheme(next);
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    const root = this.document.documentElement;
    root.classList.toggle('app-dark', mode === 'dark');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', mode);
    }
  }

  toggle(): void {
    this.setTheme(this.mode() === 'dark' ? 'light' : 'dark');
  }
}
