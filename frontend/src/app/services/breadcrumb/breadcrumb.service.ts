import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  routerLink?: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private itemsSubject = new BehaviorSubject<BreadcrumbItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  setItems(items: BreadcrumbItem[]): void {
    this.itemsSubject.next(items);
  }
}
