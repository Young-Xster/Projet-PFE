const fs = require('fs');

let file = 'src/app/components/employeeDetail.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { EmployeeDocument } from '../models/document.model'; from '../services/breadcrumb/breadcrumb.service';", "import { EmployeeDocument } from '../models/document.model';");

fs.writeFileSync(file, content);
