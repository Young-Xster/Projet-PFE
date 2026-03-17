const fs = require('fs');
const file = 'src/app/components/employeeDetail.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the specific "Edit" button
content = content.replace(
  'class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all border-none cursor-pointer"',
  '(click)="editEmployee()"\n              class="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[0.85rem] font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all border-none cursor-pointer"'
);

// Add editEmployee method to the class
if (!content.includes('editEmployee() {')) {
  content = content.replace(
    'goBack(): void {',
    `editEmployee(): void {
    if (this.employeeId) {
      this.router.navigate(['/employees', this.employeeId, 'edit']);
    }
  }

  goBack(): void {`
  );
}

fs.writeFileSync(file, content);
