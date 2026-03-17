const fs = require('fs');
const filePath = '/home/young-xster/PFE/Projet-PFE/frontend/src/app/components/employeeDetail.ts';

let content = fs.readFileSync(filePath, 'utf8');

const regex =
  /\s*<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-4 space-y-3">[\s\S]*?<\/div>\n*\s*(?=@if \(documentsLoading\))/;
content = content.replace(regex, '\n            ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done detail');
