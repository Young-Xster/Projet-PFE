import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbModule],
  template: `
    <p-breadcrumb
      [model]="items"
      [home]="home"
      [style]="{ background: 'transparent', border: '0' }"
      styleClass="!bg-transparent !border-0 !p-0 text-sm"
    />
  `,
})
export class AppBreadcrumb implements OnInit, OnDestroy {
  items: MenuItem[] = [];
  home: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };

  private sub?: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.sub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.buildBreadcrumbs());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private buildBreadcrumbs(): void {
    const breadcrumbs: MenuItem[] = [];
    let route = this.activatedRoute.root;
    let url = '';

    while (route.firstChild) {
      route = route.firstChild;

      const segment = route.snapshot.url.map((s) => s.path).join('/');
      if (segment) url += `/${segment}`;

      const ownData = route.routeConfig?.data ?? {};
      const label = ownData['breadcrumb'] ?? ownData['pageTitle'];
      if (label && breadcrumbs[breadcrumbs.length - 1]?.label !== label) {
        breadcrumbs.push({ label, routerLink: url || '/' });
      }
    }

    this.items = breadcrumbs;
  }
}
