import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-skeleton-loader',
  standalone: true,
  template: `
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <!-- Toolbar skeleton -->
      <div class="flex items-center justify-between p-5 px-6">
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[280px] h-10 rounded-lg"></div>
        <div class="flex gap-2.5">
          <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[180px] h-10 rounded-lg"></div>
          <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[100px] h-10 rounded-lg"></div>
        </div>
      </div>

      <!-- Table header skeleton -->
      <div
        class="flex gap-5 px-6 py-3.5 bg-gray-50 dark:bg-gray-700 border-y border-gray-100 dark:border-gray-700"
      >
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[120px] h-3.5 rounded"></div>
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[100px] h-3.5 rounded"></div>
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[100px] h-3.5 rounded"></div>
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[100px] h-3.5 rounded"></div>
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[60px] h-3.5 rounded"></div>
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[70px] h-3.5 rounded"></div>
        <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[80px] h-3.5 rounded"></div>
      </div>

      <!-- Table rows skeleton -->
      @for (row of rows; track $index) {
        <div
          class="flex items-center gap-5 px-6 py-4 border-b border-gray-100 dark:border-gray-700"
        >
          <div class="flex items-center gap-3" style="flex: 1.5;">
            <div
              class="bg-gray-200 dark:bg-gray-600 animate-pulse w-9 h-9 rounded-full shrink-0"
            ></div>
            <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[120px] h-3.5 rounded"></div>
          </div>
          <div
            class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[80px] h-3.5 rounded flex-1"
          ></div>
          <div
            class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[90px] h-3.5 rounded flex-1"
          ></div>
          <div
            class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[100px] h-3.5 rounded flex-1"
          ></div>
          <div
            class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[60px] h-3.5 rounded"
            style="flex: 0.7;"
          ></div>
          <div
            class="bg-gray-200 dark:bg-gray-600 animate-pulse w-[70px] h-6 rounded-full"
            style="flex: 0.8;"
          ></div>
          <div class="flex gap-1.5" style="flex: 0.8;">
            <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-7 h-7 rounded-md"></div>
            <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-7 h-7 rounded-md"></div>
            <div class="bg-gray-200 dark:bg-gray-600 animate-pulse w-7 h-7 rounded-md"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class EmployeeSkeletonLoader {
  rows = Array(8);
}
