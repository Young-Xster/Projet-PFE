const fs = require('fs');

// Patch 1: employeeDetail.ts CDR
let file1 = 'src/app/components/employeeDetail.ts';
let content1 = fs.readFileSync(file1, 'utf8');

if (!content1.includes('ChangeDetectorRef')) {
  content1 = content1.replace(
    "import { Component, OnInit } from '@angular/core';",
    "import { Component, OnInit, ChangeDetectorRef } from '@angular/core';"
  );
  
  content1 = content1.replace(
    "private breadcrumbService: BreadcrumbService,",
    "private breadcrumbService: BreadcrumbService,\n    private cdr: ChangeDetectorRef,"
  );
  
  content1 = content1.replace(
    "this.loading = false;\n          this.breadcrumbService.setItems([",
    "this.loading = false;\n          this.cdr.detectChanges();\n          this.breadcrumbService.setItems(["
  );

  content1 = content1.replace(
    "error: () => {\n          this.loading = false;\n        },",
    "error: () => {\n          this.loading = false;\n          this.cdr.detectChanges();\n        },"
  );
  
  fs.writeFileSync(file1, content1);
}

// Patch 2: editEmployss.ts parameter extraction. The route is :id/edit, so id shouldn't be null but let's make sure our nested route doesn't need parent parameter
let file2 = 'src/app/components/editEmployss.ts';
let content2 = fs.readFileSync(file2, 'utf8');

const oldExtraction = "this.employeeId = this.route.snapshot.paramMap.get('id') || '';";
const newExtraction = "this.employeeId = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id') || '';";

content2 = content2.replace(oldExtraction, newExtraction);
fs.writeFileSync(file2, content2);
