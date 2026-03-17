const fs = require('fs');

let file = 'frontend/src/app/components/employeeDetail.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Imports
if (!content.includes('DocumentService')) {
  content = content.replace(
    "import { BreadcrumbService }",
    "import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';\nimport { DocumentService } from '../services/document/document.service';\nimport { EmployeeDocument } from '../models/document.model';"
  );
  // Also clean up double breadcrumb if any
  content = content.replace("import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';\nimport { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';", "import { BreadcrumbService } from '../services/breadcrumb/breadcrumb.service';");
}

// 2. Add Documents array and loading property
if (!content.includes('documents: EmployeeDocument[]')) {
  content = content.replace(
    'loading = true;',
    'loading = true;\n  documents: EmployeeDocument[] = [];\n  documentsLoading = false;'
  );
}

// 3. Add to constructor
if (!content.includes('private documentService: DocumentService')) {
  content = content.replace(
    'private breadcrumbService: BreadcrumbService,',
    'private breadcrumbService: BreadcrumbService,\n    private documentService: DocumentService,'
  );
}

// 4. Update HTML for Document UI
// The original UI showed Documents block. Replace the content of the Documents div with a functioning loop
const oldDocsHTML = `            <div class="flex flex-col items-center p-8 text-gray-400 text-[0.85rem] gap-2">
              <svg
                class="w-12 h-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p>No documents uploaded yet</p>
            </div>`;

const newDocsHTML = `            @if (documentsLoading) {
              <div class="flex justify-center p-8">
                <div class="w-6 h-6 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            } @else if (documents.length > 0) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (doc of documents; track doc.id) {
                  <div class="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100/50 text-purple-600 shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-800 truncate" [title]="doc.documentName">{{ doc.documentName }}</p>
                        <p class="text-xs text-gray-500 capitalize">{{ doc.documentType.replace('_', ' ') }} • {{ (doc.fileSize / 1024).toFixed(1) }} KB</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0 ml-4">
                      <button (click)="downloadDocument(doc)" class="p-2 rounded-md hover:bg-purple-100 text-purple-600 transition-colors tooltip" title="Download">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="flex flex-col items-center p-8 text-gray-400 text-[0.85rem] gap-2">
                <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p>No documents uploaded yet</p>
              </div>
            }`;

if (content.includes(oldDocsHTML)) {
  content = content.replace(oldDocsHTML, newDocsHTML);
}

// 5. Add loadDocuments function to class, inject it into ngOnInit, and add downloadDocument
const loadDocsImpl = `
  loadDocuments(id: string): void {
    this.documentsLoading = true;
    this.documentService.getDocumentsByEmployee(id).subscribe({
      next: (res: any) => {
        this.documents = res?.data || res || [];
        this.documentsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.documentsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  downloadDocument(doc: EmployeeDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.documentName || 'document';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  editEmployee(): void {`;

if (!content.includes('loadDocuments(')) {
  content = content.replace('  editEmployee(): void {', loadDocsImpl);
  content = content.replace(
    "this.loading = false;\n          this.cdr.detectChanges();",
    "this.loading = false;\n          this.cdr.detectChanges();\n          this.loadDocuments(emp.employeeId);"
  );
}

fs.writeFileSync(file, content);
