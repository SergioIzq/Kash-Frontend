import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';

import { ReglaCategorizacion, ReglaCategorizacionCreate } from '@/core/models/regla-categorizacion.model';

@Component({
    selector: 'app-regla-categorizacion-form-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectButtonModule, CheckboxModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-dialog
            [visible]="visible()"
            (visibleChange)="visibleChange.emit($event)"
            [modal]="true"
            [style]="{ width: '32rem' }"
            [header]="isEditMode() ? 'Editar regla' : 'Nueva regla de categorización'"
        >
            <div class="flex flex-col gap-4">
                <div>
                    <label class="font-semibold text-sm block mb-1">Patrón a buscar en la descripción *</label>
                    <input pInputText class="w-full" placeholder="Ej. MERCADONA, CARREFOUR" [(ngModel)]="patron" />
                    <small class="text-500">Varias palabras separadas por coma; basta con que coincida una.</small>
                    @if (submitted() && !patron.trim()) {
                        <small class="block text-red-500 mt-1">El patrón es obligatorio.</small>
                    }
                </div>

                <div>
                    <label class="font-semibold text-sm block mb-1">Se aplica a</label>
                    <p-selectbutton [options]="tipoOptions" optionLabel="label" optionValue="value" [(ngModel)]="tipo" [allowEmpty]="false" />
                </div>

                <div>
                    <label class="font-semibold text-sm block mb-1">Categoría *</label>
                    <input pInputText class="w-full" placeholder="Ej. Alimentación" [(ngModel)]="categoriaNombre" />
                    @if (submitted() && !categoriaNombre.trim()) {
                        <small class="block text-red-500 mt-1">La categoría es obligatoria.</small>
                    }
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="font-semibold text-sm block mb-1">Concepto</label>
                        <input pInputText class="w-full" placeholder="Opcional" [(ngModel)]="conceptoNombre" />
                    </div>
                    <div>
                        <label class="font-semibold text-sm block mb-1">Proveedor</label>
                        <input pInputText class="w-full" placeholder="Opcional (solo gastos)" [(ngModel)]="proveedorNombre" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="font-semibold text-sm block mb-1">Forma de pago</label>
                        <input pInputText class="w-full" placeholder="Opcional" [(ngModel)]="formaPagoNombre" />
                    </div>
                    <div>
                        <label class="font-semibold text-sm block mb-1">Prioridad</label>
                        <p-inputnumber [(ngModel)]="prioridad" [showButtons]="true" [min]="0" [max]="999" styleClass="w-full" />
                        <small class="text-500">Menor número = se evalúa antes.</small>
                    </div>
                </div>

                <div class="flex align-items-center gap-2">
                    <p-checkbox [binary]="true" inputId="activo" [(ngModel)]="activo" />
                    <label for="activo" class="text-sm">Regla activa</label>
                </div>

                @if (errorMessage()) {
                    <small class="text-red-500">{{ errorMessage() }}</small>
                }
            </div>

            <ng-template #footer>
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="onCancel()" />
                <p-button label="Guardar" icon="pi pi-check" [loading]="loading()" (onClick)="onSave()" />
            </ng-template>
        </p-dialog>
    `
})
export class ReglaCategorizacionFormModalComponent {
    visible = input.required<boolean>();
    regla = input<Partial<ReglaCategorizacion> | null>(null);
    loading = input<boolean>(false);

    visibleChange = output<boolean>();
    save = output<ReglaCategorizacionCreate & { id?: string }>();
    cancel = output<void>();

    submitted = signal(false);
    errorMessage = signal<string | null>(null);

    patron = '';
    tipo: 'gasto' | 'ingreso' | null = null;
    categoriaNombre = '';
    conceptoNombre = '';
    proveedorNombre = '';
    formaPagoNombre = '';
    prioridad = 0;
    activo = true;

    readonly tipoOptions = [
        { label: 'Gastos e ingresos', value: null },
        { label: 'Solo gastos', value: 'gasto' },
        { label: 'Solo ingresos', value: 'ingreso' }
    ];

    isEditMode = signal(false);

    constructor() {
        effect(() => {
            const r = this.regla();
            const isEdit = !!r?.id;
            this.isEditMode.set(isEdit);
            this.submitted.set(false);
            this.errorMessage.set(null);

            this.patron = r?.patron ?? '';
            this.tipo = r?.tipo ?? null;
            this.categoriaNombre = r?.categoriaNombre ?? '';
            this.conceptoNombre = r?.conceptoNombre ?? '';
            this.proveedorNombre = r?.proveedorNombre ?? '';
            this.formaPagoNombre = r?.formaPagoNombre ?? '';
            this.prioridad = r?.prioridad ?? 0;
            this.activo = r?.activo ?? true;
        });
    }

    onSave(): void {
        this.submitted.set(true);
        if (!this.patron.trim() || !this.categoriaNombre.trim()) {
            return;
        }

        this.save.emit({
            id: this.regla()?.id,
            patron: this.patron.trim(),
            tipo: this.tipo,
            categoriaNombre: this.categoriaNombre.trim(),
            conceptoNombre: this.conceptoNombre.trim() || null,
            proveedorNombre: this.proveedorNombre.trim() || null,
            formaPagoNombre: this.formaPagoNombre.trim() || null,
            prioridad: this.prioridad,
            activo: this.activo
        });
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
