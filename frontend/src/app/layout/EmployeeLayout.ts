import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SideBarNavigation } from '../components/sideNavigation';
import { TopPanelComponent } from '../components/topPanel';
import { AppBreadcrumb } from '../components/breadCrumb';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SideBarNavigation, TopPanelComponent, AppBreadcrumb],
  template: `
    <div class="flex h-screen overflow-hidden" style="background-color: var(--sip-bg);">
      <!-- Sidebar -->
      <side-bar-navigation />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top Panel -->
        <app-top-panel />

        <!-- Page Header (title + breadcrumb) -->
        <div
          class="px-6 pt-4 pb-3"
          style="background-color: var(--sip-surface); border-bottom: 1px solid var(--sip-border);"
        >
          <h1 class="text-2xl font-bold" style="color: var(--sip-text);">{{ pageTitle }}</h1>
          <app-breadcrumb />
        </div>

        <!-- Content -->
        <main class="flex-1 overflow-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class EmployeeLayout implements OnInit, OnDestroy {
  pageTitle = '';
  private sub!: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.updateTitle();
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private updateTitle(): void {
    let route = this.activatedRoute.root;
    let title = '';

    while (route.firstChild) {
      route = route.firstChild;
      const ownData = route.routeConfig?.data ?? {};
      if (ownData['pageTitle']) {
        title = ownData['pageTitle'];
      }
    }

    this.pageTitle = title;
  }
}
