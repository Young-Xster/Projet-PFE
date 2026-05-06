const fs = require('fs');
const file = 'frontend/src/app/layout/EmployeeLayout.ts';
let content = fs.readFileSync(file, 'utf8');

// Add AuthService to imports if not there
if(!content.includes('AuthService')) {
    content = content.replace("import { AppBreadcrumb } from '../components/breadCrumb';", 
        "import { AppBreadcrumb } from '../components/breadCrumb';\nimport { AuthService } from '../core/auth/auth.service';");
}

// Add auth: AuthService to constructor
content = content.replace('constructor(\n    private router: Router,\n    private activatedRoute: ActivatedRoute,\n  ) {}', 
  'constructor(\n    private router: Router,\n    private activatedRoute: ActivatedRoute,\n    private auth: AuthService\n  ) {}');

// Update ngOnInit to load context and redirect
const initLogic = `async ngOnInit(): Promise<void> {
    this.updateTitle();
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.updateTitle());
      
    if (this.auth.isAuthenticated()) {
      await this.auth.loadUserContext();
      
      let target = this.auth.consumePostLoginRedirect();
      if (!target || target === '/dashboard') {
        target = this.auth.getDefaultRoute();
      }

      if (target && target !== this.router.url && this.router.url === '/dashboard') {
        this.router.navigateByUrl(target);
      }
    }
  }`;

content = content.replace(/ngOnInit\(\): void \{\s*this\.updateTitle\(\);\s*this\.sub = this\.router\.events\s*\.pipe\(filter\(\(e\) => e instanceof NavigationEnd\)\)\s*\.subscribe\(\(\) => this\.updateTitle\(\)\);\s*\}/s, initLogic);

fs.writeFileSync(file, content);
console.log('Fixed EmployeeLayout');
