import { Component, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FileUploadEvent, FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  template: `
    <p-toast />
    <div class="card flex flex-wrap gap-6 items-center justify-between">
      <p-fileupload
        #fu
        mode="basic"
        chooseLabel="Choose"
        chooseIcon="pi pi-upload"
        name="demo[]"
        url="https://www.primefaces.org/cdn/api/upload.php"
        accept="image/*"
        maxFileSize="1000000"
        (onUpload)="onUpload($event)"
      />
      <p-button label="Upload" (onClick)="fu.upload()" severity="secondary" />
    </div>
  `,
  standalone: true,
  imports: [ButtonModule, FileUploadModule, ToastModule],
  providers: [MessageService],
})
export class FileuploadBasicDemo {
  private messageService = inject(MessageService);

  onUpload(event: FileUploadEvent) {
    this.messageService.add({
      severity: 'info',
      summary: 'Upload Complete',
      detail: `${event.files.length} file(s) uploaded.`,
    });
  }
}
