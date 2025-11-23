import { Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

/**
 * Template compartido para páginas con Toast y ConfirmDialog
 * Uso: Extender de esta clase para heredar el template común
 */
@Component({
    selector: 'app-base-page-template',
    standalone: true,
    imports: [ToastModule, ConfirmDialogModule],
    template: `
        <p-toast></p-toast>
        <p-confirmdialog [style]="{ width: '450px' }" />
        <ng-content></ng-content>
    `
})
export class BasePageTemplateComponent {}
