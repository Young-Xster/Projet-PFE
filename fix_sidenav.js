const fs = require('fs');
const file = 'frontend/src/app/components/sideNavigation.ts';
let content = fs.readFileSync(file, 'utf8');

// Change private authService to public
content = content.replace('private authService: AuthService', 'public authService: AuthService');

// Wrap elements
const replacements = [
  { module: '/employees', perm: 'employees:read' },
  { module: '/performance', perm: 'performance:read' },
  { module: '/departments', perm: 'departments:read' },
  { module: '/positions', perm: 'positions:read' },
  { module: '/attendance', perm: 'attendance:read' },
  { module: '/payroll', perm: 'payroll:read' },
  { module: '/jobs', perm: 'recruitment_requests:read' },
  { module: '/schedules', perm: 'work_schedules:read' },
  { module: '/leaves', perm: 'leave_requests:read' },
  { module: '/notifications', perm: 'notifications:read' }, // If any, or unconditionally? Let's hide if not superadmin or specific. "notifications" doesn't strictly have a read perm, let's leave it un-wrapped or use a general one. Let's just wrap the ones we mapped.
  { module: '/subcontractors', perm: 'subcontractors:read' }
];

for (let r of replacements) {
    const rx = new RegExp(`(<a\\s+routerLink="${r.module}"(?:.|\n)*?<\\/a>)`, 'g');
    content = content.replace(rx, `@if (authService.hasPermission('${r.perm}')) {\n        $1\n        }`);
}

fs.writeFileSync(file, content);
console.log('Fixed side nav.');
