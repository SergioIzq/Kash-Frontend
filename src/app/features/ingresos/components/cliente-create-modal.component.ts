import { Component, inject, input, output, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ClienteService, ClienteItem } from '@/core/services/api/cliente.service';

@Component({
    selector: 'app-cliente-create-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog [(visible)]="isVisible" [style]="{ width: '450px' }" header="Crear Nuevo Cliente" [modal]="true" [contentStyle]="{ padding: '2rem' }" (onHide)="onCancel()" styleClass="p-fluid">
            <ng-template #content>
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="nombre" class="block font-bold mb-3">Nombre del Cliente *</label>
                        <input type="text" pInputText id="nombre" [(ngModel)]="nombre" required autofocus placeholder="Ej: Empresa XYZ" fluid />
                        @if (submitted() && !nombre.trim()) {
                            <small class="text-red-500"> El nombre es requerido. </small>
                        }
                    </div>

                    @if (errorMessage()) {
                        <small class="text-red-500">{{ errorMessage() }}</small>
                    }
                </div>
            </ng-template>

            <ng-template #footer>
                <p-button label="Cancelar" icon="pi pi-times" text (click)="onCancel()" [disabled]="loading()" />
                <p-button label="Crear" icon="pi pi-check" (click)="onCreate()" [loading]="loading()" />
            </ng-template>
        </p-dialog>
    `
})
export class ClienteCreateModalComponent {
    private messageService = inject(MessageService);
    private clienteService = inject(ClienteService);

    // Inputs/Outputs
    visible = input<boolean>(false);
    visibleChange = output<boolean>();
    created = output<ClienteItem>();
    cancel = output<void>();

    // Estado del formulario
    nombre: string = '';
    submitted = signal(false);
    loading = signal(false);
    errorMessage = signal<string>('');

    isVisible = false;

    constructor() {
        // Sincronizar visible con isVisible interno
        effect(() => {
            this.isVisible = this.visible();

            // Limpiar formulario cuando se abre
            if (this.visible()) {
                this.nombre = '';
                this.submitted.set(false);
                this.loading.set(false);
                this.errorMessage.set('');
            }
        });
    }

    onCreate() {
        this.submitted.set(true);
        this.errorMessage.set('');

        if (!this.nombre.trim()) {
            return;
        }

        this.loading.set(true);

        this.clienteService.create(this.nombre.trim()).subscribe({
            next: (nuevoCliente) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Cliente "${nuevoCliente.nombre}" creado correctamente`,
                    life: 3000
                });

                this.created.emit(nuevoCliente);
                this.closeModal();
            },
            error: (error) => {
                console.error('Error creando cliente:', error);
                this.errorMessage.set(error.error?.message || 'Error al crear el cliente');
                this.loading.set(false);
            }
        });
    }

    onCancel() {
        this.cancel.emit();
        this.closeModal();
    }

    private closeModal() {
        this.isVisible = false;
        this.visibleChange.emit(false);
        this.nombre = '';
        this.submitted.set(false);
        this.loading.set(false);
        this.errorMessage.set('');
    }
}
