import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  AdminUser,
  Company,
  CreateUserPayload,
  PermissionCatalog,
  Role,
} from '../../services/admin/admin.service';

@Component({
  selector: 'app-user-roles-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Create User</h2>

        @if (errorMessage) {
          <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {{ errorMessage }}
          </div>
        }
        @if (successMessage) {
          <div
            class="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200"
          >
            {{ successMessage }}
          </div>
        }

        <form class="space-y-3" (ngSubmit)="createUser()">
          <input
            [(ngModel)]="createUserForm.username"
            name="username"
            placeholder="Username"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="createUserForm.email"
            name="email"
            type="email"
            placeholder="Email"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <select
            [(ngModel)]="createUserForm.companyId"
            name="companyId"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          >
            <option value="" disabled>Select company</option>
            @for (company of companies; track company.id) {
              <option [value]="company.id">{{ company.name }}</option>
            }
          </select>
          <select
            [(ngModel)]="createUserForm.roleName"
            name="roleName"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          >
            <option value="" disabled>Select role</option>
            @for (role of roles; track role.roleName) {
              <option [value]="role.roleName">{{ role.roleName }}</option>
            }
          </select>
          <button
            type="submit"
            [disabled]="loading"
            class="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-medium disabled:opacity-60"
          >
            Create User + Send Setup Email
          </button>
        </form>
      </section>

      <section
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
      >
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Role Management</h2>

        <form class="space-y-3" (ngSubmit)="createRole()">
          <input
            [(ngModel)]="newRoleName"
            name="newRoleName"
            placeholder="Role name"
            required
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <input
            [(ngModel)]="newRoleDescription"
            name="newRoleDescription"
            placeholder="Description"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
          />
          <div
            class="max-h-64 overflow-auto p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
          >
            @for (module of availableModules; track module.moduleName) {
              <div
                class="mb-3 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <div
                  class="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-1 mb-2"
                >
                  <span class="font-semibold text-sm text-gray-700 dark:text-gray-200">{{
                    module.displayName
                  }}</span>
                  <button
                    type="button"
                    (click)="toggleAllModulePermissions(module)"
                    class="text-xs font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Toggle All
                  </button>
                </div>
                <div class="grid grid-cols-2 gap-1 px-1">
                  @for (action of module.actions; track action.name) {
                    <label
                      class="flex items-center gap-2 text-xs py-1 text-gray-600 dark:text-gray-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        [checked]="isPermissionSelected(action.name)"
                        (change)="togglePermission(action.name, $event)"
                        class="rounded border-gray-300 dark:border-gray-600 outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                      />
                      <span>{{ action.displayName }}</span>
                    </label>
                  }
                </div>
              </div>
            }
          </div>
          <button
            type="submit"
            [disabled]="loading || selectedPermissions.length === 0"
            class="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-medium disabled:opacity-60"
          >
            Create Role
          </button>
        </form>
      </section>
    </div>

    <section
      class="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Users</h2>
        <button
          type="button"
          (click)="loadUsers()"
          class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr
              class="text-left text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
            >
              <th class="py-2 pr-3">Username</th>
              <th class="py-2 pr-3">Email</th>
              <th class="py-2 pr-3">Role</th>
              <th class="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users; track user.id) {
              <tr class="border-b border-gray-100 dark:border-gray-700">
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ user.username }}</td>
                <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ user.email }}</td>
                <td class="py-2 pr-3">
                  <select
                    [ngModel]="getUserPrimaryRole(user)"
                    (ngModelChange)="changeUserRole(user, $event)"
                    class="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    @for (role of roles; track role.roleName) {
                      <option [value]="role.roleName">{{ role.roleName }}</option>
                    }
                  </select>
                </td>
                <td class="py-2 pr-3 flex gap-2 items-center">
                  <button
                    type="button"
                    (click)="resendSetupEmail(user)"
                    class="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                  >
                    Resend setup email
                  </button>
                  <button
                    type="button"
                    (click)="deleteUser(user)"
                    class="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="py-6 text-center text-gray-400">No users found.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    <section
      class="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5"
    >
      <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Existing Roles</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        @for (role of roles; track role.roleName) {
          <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <p class="font-medium text-gray-700 dark:text-gray-100">{{ role.roleName }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-300 mt-1">
              {{ role.description || 'No description' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-300 mt-2">
              {{ role.permissions.length }} permissions
            </p>
            <button
              type="button"
              (click)="deleteRole(role.roleName)"
              class="mt-2 px-2 py-1 rounded border border-red-200 text-red-600 text-xs"
            >
              Delete
            </button>
          </div>
        }
      </div>
    </section>
  `,
})
export class UserRolesAdminPage implements OnInit {
  companies: Company[] = [];
  users: AdminUser[] = [];
  roles: Role[] = [];

  createUserForm: CreateUserPayload = {
    username: '',
    email: '',
    companyId: '',
    roleName: '',
  };

  newRoleName = '';
  newRoleDescription = '';
  availableModules: PermissionCatalog['modules'] = [];
  selectedPermissions: string[] = [];

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.bootstrap();
  }

  private bootstrap(): void {
    this.loadCompanies();
    this.loadRoles();
    this.loadUsers();
    this.loadPermissions();
  }

  loadCompanies(): void {
    this.adminService.getCompanies().subscribe({
      next: (res) => {
        this.companies = res.data ?? [];
        if (!this.createUserForm.companyId && this.companies.length > 0) {
          this.createUserForm.companyId = this.companies[0].id;
        }
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load companies');
        this.cdr.detectChanges();
      },
    });
  }

  loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (res) => {
        this.roles = res.data ?? [];
        if (!this.createUserForm.roleName && this.roles.length > 0) {
          this.createUserForm.roleName = this.roles[0].roleName;
        }
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load roles');
        this.cdr.detectChanges();
      },
    });
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.users = res.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load users');
        this.cdr.detectChanges();
      },
    });
  }

  loadPermissions(): void {
    this.adminService.getPermissionCatalog().subscribe({
      next: (res) => {
        const catalog: PermissionCatalog | undefined = res.data;
        const hiddenModules = ['users', 'roles', 'permissions', 'companies'];
        this.availableModules =
          catalog?.modules.filter((module) => !hiddenModules.includes(module.moduleName)) ?? [];
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to load permissions');
        this.cdr.detectChanges();
      },
    });
  }

  createUser(): void {
    this.clearMessages();
    this.loading = true;
    this.adminService.createUser(this.createUserForm).subscribe({
      next: () => {
        this.successMessage = 'User created and setup email sent.';
        this.createUserForm = {
          username: '',
          email: '',
          companyId: this.companies[0]?.id ?? '',
          roleName: this.roles[0]?.roleName ?? '',
        };
        this.loading = false;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to create user');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  changeUserRole(user: AdminUser, roleName: string): void {
    if (!roleName || this.getUserPrimaryRole(user) === roleName) {
      return;
    }

    this.clearMessages();
    this.adminService.updateUserRole(user.id, roleName).subscribe({
      next: () => {
        this.successMessage = `Updated role for ${user.username}.`;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to update user role');
        this.cdr.detectChanges();
      },
    });
  }

  resendSetupEmail(user: AdminUser): void {
    this.clearMessages();
    this.adminService.resendSetupEmail(user.id).subscribe({
      next: () => {
        this.successMessage = `Setup email resent to ${user.email}.`;
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to resend setup email');
        this.cdr.detectChanges();
      },
    });
  }

  deleteUser(user: AdminUser): void {
    if (!confirm(`Are you sure you want to delete user ${user.username}?`)) return;
    this.clearMessages();
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = `User ${user.username} deleted successfully.`;
        this.loadUsers();
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to delete user');
        this.cdr.detectChanges();
      },
    });
  }

  createRole(): void {
    if (!this.newRoleName.trim() || this.selectedPermissions.length === 0) {
      return;
    }

    this.clearMessages();
    this.loading = true;
    this.adminService
      .createRole({
        roleName: this.newRoleName.trim(),
        description: this.newRoleDescription.trim() || undefined,
        permissions: this.selectedPermissions,
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Role created successfully.';
          this.newRoleName = '';
          this.newRoleDescription = '';
          this.selectedPermissions = [];
          this.loading = false;
          this.loadRoles();
          this.cdr.detectChanges();
        },
        error: (err: unknown) => {
          this.errorMessage = this.extractError(err, 'Failed to create role');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  deleteRole(roleName: string): void {
    this.clearMessages();
    this.adminService.deleteRole(roleName).subscribe({
      next: () => {
        this.successMessage = `Role ${roleName} deleted.`;
        this.loadRoles();
        this.cdr.detectChanges();
      },
      error: (err: unknown) => {
        this.errorMessage = this.extractError(err, 'Failed to delete role');
        this.cdr.detectChanges();
      },
    });
  }

  togglePermission(permission: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      if (!this.selectedPermissions.includes(permission)) {
        this.selectedPermissions = [...this.selectedPermissions, permission];
      }
      return;
    }

    this.selectedPermissions = this.selectedPermissions.filter((item) => item !== permission);
  }

  toggleAllModulePermissions(module: any): void {
    const moduleActions = module.actions.map((a: any) => a.name);
    const allSelected = moduleActions.every((action: string) =>
      this.selectedPermissions.includes(action),
    );

    if (allSelected) {
      this.selectedPermissions = this.selectedPermissions.filter((p) => !moduleActions.includes(p));
    } else {
      const toAdd = moduleActions.filter(
        (action: string) => !this.selectedPermissions.includes(action),
      );
      this.selectedPermissions = [...this.selectedPermissions, ...toAdd];
    }
  }

  isPermissionSelected(permission: string): boolean {
    return this.selectedPermissions.includes(permission);
  }

  getUserPrimaryRole(user: AdminUser): string {
    return user.roleNames?.[0] ?? this.roles[0]?.roleName ?? '';
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private extractError(err: unknown, fallback: string): string {
    const maybeError = err as { error?: { message?: string } };
    return maybeError?.error?.message ?? fallback;
  }
}
