import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8"
    >
      <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-100">{{ title }}</h2>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-300">{{ description }}</p>
    </div>
  `,
})
export class PlaceholderPageComponent {
  title = 'Page';
  description = 'This section is ready for implementation.';

  constructor(private route: ActivatedRoute) {
    this.title = this.route.snapshot.data['pageTitle'] ?? 'Page';
    this.description =
      this.route.snapshot.data['description'] ?? 'This section is ready for implementation.';
  }
}
