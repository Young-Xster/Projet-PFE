const fs = require('fs');
const file = '/home/young-xster/PFE/Projet-PFE/frontendemployees/src/app/app.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<!-- LEAVE TAB -->\s*<div \*ngIf="currentTab\(\) === 'leave'" class="animate-in fade-in duration-300">\s*<div>/g,
  `<!-- LEAVE TAB -->\n        <div *ngIf="currentTab() === 'leave'" class="animate-in fade-in duration-300">\n        <form (ngSubmit)="submitLeaveRequest()" class="space-y-5">\n          <div>`);

const balancesHtml = `
        <!-- Employee Status / Balances Section -->
        <div class="mb-8" *ngIf="balances().length > 0">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-800">Your Leave Balances</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let balance of balances()" class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-colors">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <i class="fas fa-calendar-check mt-1"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">{{balance.leaveTypeName || 'Leave Type'}}</h3>
                  <p class="text-sm text-gray-500">Allocated: {{balance.totalDays}} days</p>
                </div>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold" [ngClass]="{'text-green-600': balance.remainingDays > 5, 'text-orange-500': balance.remainingDays > 0 && balance.remainingDays <= 5, 'text-red-500': balance.remainingDays === 0}">
                  {{balance.remainingDays}}
                </div>
                <div class="text-xs text-gray-500 font-medium">Remaining</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard Tabs -->`;

content = content.replace(/<!-- Dashboard Tabs -->/g, balancesHtml);

fs.writeFileSync(file, content);
console.log('Fixed app.html');
