import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PortalSessionResponse {
  sessionToken: string;
  expiresAt: string;
  subcontractorId: string;
  subcontractorDisplayName: string;
}

interface PortalProfile {
  subcontractorId: string;
  companyId: string;
  companyName: string;
  subcontractorCompanyName: string;
  contactFirstName: string;
  contactLastName: string;
  displayName: string;
  type: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  specialization: string;
  status: string;
}

interface PortalContract {
  id: string;
  displayName?: string;
  startDate: string;
  endDate: string;
  paymentType: string;
  amount: number;
  status: string;
  notes?: string;
  documentDownloadUrl?: string;
}

interface PortalInvoice {
  id: string;
  contractId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  notes?: string;
  invoiceDocumentDownloadUrl?: string;
  paymentProofDownloadUrl?: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiBaseUrl = 'http://localhost:8081/api/v1/subcontractors/portal';

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly hasSession = signal(false);

  readonly accessEmail = signal('');

  readonly sessionToken = signal('');
  readonly sessionExpiresAt = signal('');
  readonly activeTab = signal<'dashboard' | 'contact'>('dashboard');

  readonly profile = signal<PortalProfile | null>(null);
  readonly contracts = signal<PortalContract[]>([]);
  readonly invoices = signal<PortalInvoice[]>([]);

  readonly invoiceContractId = signal('');
  readonly invoiceNumber = signal('');
  readonly invoiceAmount = signal('');
  readonly invoiceDueDate = signal('');
  readonly invoiceNotes = signal('');
  private invoiceDocumentFile: File | null = null;

  readonly contactEmail = signal('');
  readonly subcontractorCompanyName = signal('');
  readonly contactFirstName = signal('');
  readonly contactLastName = signal('');
  readonly contactPhone = signal('');
  readonly address = signal('');
  readonly city = signal('');
  readonly specialization = signal('');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeSessionFromUrl();
    }
  }

  private initializeSessionFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      this.exchangeMagicLink(urlToken);
      return;
    }

    const existingSession = localStorage.getItem('subcontractor_portal_session');
    const existingExpiry = localStorage.getItem('subcontractor_portal_expiry');
    if (existingSession && existingExpiry) {
      const expiryDate = new Date(existingExpiry);
      if (expiryDate.getTime() > Date.now()) {
        this.sessionToken.set(existingSession);
        this.sessionExpiresAt.set(existingExpiry);
        this.hasSession.set(true);
        this.refreshPortalData();
      } else {
        localStorage.removeItem('subcontractor_portal_session');
        localStorage.removeItem('subcontractor_portal_expiry');
      }
    }
  }

  requestAccessLink(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      email: this.accessEmail().trim().toLowerCase(),
    };

    this.http.post<ApiResponse<null>>(`${this.apiBaseUrl}/public/request-access`, payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set(res.message || 'If your details are valid, we sent an access link.');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Could not request access link.');
      },
    });
  }

  logout(): void {
    const token = this.sessionToken();
    if (!token) {
      return;
    }

    this.http.post<ApiResponse<null>>(
      `${this.apiBaseUrl}/me/logout`,
      {},
      { headers: this.portalHeaders() },
    ).subscribe({
      next: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  refreshPortalData(): void {
    const token = this.sessionToken();
    if (!token) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<ApiResponse<PortalProfile>>(`${this.apiBaseUrl}/me`, { headers: this.portalHeaders() }).subscribe({
      next: (profileRes) => {
        this.profile.set(profileRes.data);
        this.syncContactFields(profileRes.data);

        this.http.get<ApiResponse<PortalContract[]>>(`${this.apiBaseUrl}/me/contracts`, { headers: this.portalHeaders() }).subscribe({
          next: (contractsRes) => {
            this.contracts.set(contractsRes.data || []);

            this.http.get<ApiResponse<PortalInvoice[]>>(`${this.apiBaseUrl}/me/invoices`, { headers: this.portalHeaders() }).subscribe({
              next: (invoicesRes) => {
                this.invoices.set(invoicesRes.data || []);
                this.loading.set(false);
              },
              error: (err) => this.handlePortalError(err),
            });
          },
          error: (err) => this.handlePortalError(err),
        });
      },
      error: (err) => this.handlePortalError(err),
    });
  }

  submitInvoice(): void {
    const contractId = this.invoiceContractId();
    if (!contractId) {
      this.errorMessage.set('Choose a contract before submitting an invoice.');
      return;
    }

    const formData = new FormData();
    formData.append('invoiceNumber', this.invoiceNumber());
    formData.append('amount', this.invoiceAmount());
    formData.append('dueDate', this.invoiceDueDate());
    if (this.invoiceNotes().trim()) {
      formData.append('notes', this.invoiceNotes().trim());
    }
    if (this.invoiceDocumentFile) {
      formData.append('invoiceDocument', this.invoiceDocumentFile);
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.post<ApiResponse<PortalInvoice>>(
      `${this.apiBaseUrl}/me/contracts/${contractId}/invoices`,
      formData,
      { headers: this.portalHeaders() },
    ).subscribe({
      next: (res) => {
        this.successMessage.set(res.message || 'Invoice submitted.');
        this.resetInvoiceForm();
        this.refreshPortalData();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Could not submit invoice.');
      },
    });
  }

  updateContactInfo(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const payload = {
      companyName: this.subcontractorCompanyName(),
      contactFirstName: this.contactFirstName(),
      contactLastName: this.contactLastName(),
      contactEmail: this.contactEmail(),
      contactPhone: this.contactPhone(),
      address: this.address(),
      city: this.city(),
      specialization: this.specialization(),
    };

    this.http.put<ApiResponse<PortalProfile>>(`${this.apiBaseUrl}/me/contact-info`, payload, {
      headers: this.portalHeaders(),
    }).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.successMessage.set(res.message || 'Contact info updated.');
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Could not update contact info.');
      },
    });
  }

  onInvoiceDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.invoiceDocumentFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  downloadDocument(url: string, filename: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const fullUrl = url.startsWith('http') ? url : `http://localhost:8081${url.startsWith('/') ? '' : '/'}${url}`;

    this.http
      .get(fullUrl, { responseType: 'blob', headers: this.portalHeaders() })
      .subscribe({
        next: (blob) => {
          this.loading.set(false);
          const objectUrl = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = objectUrl;
          anchor.download = filename;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          window.URL.revokeObjectURL(objectUrl);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set('Could not download document.');
        },
      });
  }

  getContractDisplayLabel(contract: PortalContract): string {
    if (contract.displayName && contract.displayName.trim().length > 0) {
      return contract.displayName;
    }
    return `${contract.startDate} → ${contract.endDate} · ${contract.paymentType} · ${contract.status}`;
  }

  private exchangeMagicLink(rawToken: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('Opening your portal session...');

    this.http.post<ApiResponse<PortalSessionResponse>>(`${this.apiBaseUrl}/public/session`, { token: rawToken }).subscribe({
      next: (res) => {
        const session = res.data;
        this.sessionToken.set(session.sessionToken);
        this.sessionExpiresAt.set(session.expiresAt);
        this.hasSession.set(true);
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('subcontractor_portal_session', session.sessionToken);
          localStorage.setItem('subcontractor_portal_expiry', session.expiresAt);
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
        }

        this.successMessage.set('Session created successfully.');
        this.refreshPortalData();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'The access link is invalid or expired.');
        this.successMessage.set('');
      },
    });
  }

  private portalHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Portal-Session': this.sessionToken(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }

  private handlePortalError(err: unknown): void {
    this.loading.set(false);
    const errObj = err as { error?: { message?: string }; status?: number };
    const message = errObj?.error?.message || 'Could not load portal data.';
    const status = errObj?.status;
    this.errorMessage.set(message);

    if (status === 401 || message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('not found')) {
      this.clearSession();
    }
  }

  private syncContactFields(profile: PortalProfile): void {
    this.subcontractorCompanyName.set(profile.subcontractorCompanyName || '');
    this.contactFirstName.set(profile.contactFirstName || '');
    this.contactLastName.set(profile.contactLastName || '');
    this.contactEmail.set(profile.contactEmail || '');
    this.contactPhone.set(profile.contactPhone || '');
    this.address.set(profile.address || '');
    this.city.set(profile.city || '');
    this.specialization.set(profile.specialization || '');
  }

  private clearSession(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('subcontractor_portal_session');
      localStorage.removeItem('subcontractor_portal_expiry');
    }
    this.hasSession.set(false);
    this.sessionToken.set('');
    this.sessionExpiresAt.set('');
    this.profile.set(null);
    this.contracts.set([]);
    this.invoices.set([]);
    this.subcontractorCompanyName.set('');
    this.contactFirstName.set('');
    this.contactLastName.set('');
    this.contactEmail.set('');
    this.contactPhone.set('');
    this.address.set('');
    this.city.set('');
    this.specialization.set('');
    this.activeTab.set('dashboard');
    this.successMessage.set('Session closed.');
    this.loading.set(false);
  }

  private resetInvoiceForm(): void {
    this.invoiceContractId.set('');
    this.invoiceNumber.set('');
    this.invoiceAmount.set('');
    this.invoiceDueDate.set('');
    this.invoiceNotes.set('');
    this.invoiceDocumentFile = null;
  }
}
