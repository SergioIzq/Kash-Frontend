import { Component, inject, ChangeDetectionStrategy, ViewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule, Table } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { TooltipModule } from 'primeng/tooltip';
import { DataViewModule } from 'primeng/dataview';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { ReglaCategorizacionStore } from '@/features/reglas-categorizacion/store/regla-categorizacion.store';
import { ReglaCategorizacion, ReglaCategorizacionCreate } from '@/core/models/regla-categorizacion.model';
import { ReglaCategorizacionFormModalComponent } from '../components/regla-categorizacion-form-modal.component';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';
import { LayoutService } from '@/layout/service/layout.service';

@Component({
    selector: 'app-reglas-categorizacion-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TableModule,
        InputTextModule,
        TagModule,
        ToggleSwitchModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        InputIconModule,
        IconFieldModule,
        TooltipModule,
        DataViewModule,
        ReglaCategorizacionFormModalComponent,
        BasePageTemplateComponent
    ],
    providers: [MessageService, ConfirmationService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        /* Toolbar responsive en móvil */
        @media screen and (max-width: 768px) {
            :host ::ng-deep .p-toolbar {
                flex-direction: column !important;
                align-items: stretch !important;
            }

            :host ::ng-deep .p-toolbar-group-start,
            :host ::ng-deep .p-toolbar-group-end {
                width: 100% !important;
                justify-content: center !important;
            }

            :host ::ng-deep .p-toolbar-group-start {
                margin-bottom: 0.5rem;
            }
        }
    `],
    template: `
        <app-base-page-template [loading]="store.loading()" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">

                    <p-toolbar styleClass="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button label="Nueva Regla" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                        </ng-template>
                        <ng-template #end>
                            <p-button icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="refreshTable()" pTooltip="Actualizar" />
                        </ng-template>
                    </p-toolbar>

                    <p class="text-500 mt-0 mb-4 text-sm">
                        Estas reglas se aplican automáticamente al previsualizar un extracto bancario: si la descripción de un
                        movimiento contiene el patrón, se propone la categoría/concepto/proveedor indicados en vez de "Sin clasificar".
                        Se evalúan por orden de prioridad (menor número primero) y gana la primera que coincide.
                    </p>

                    @if (!layout.isMobileView()) {
                    <p-table
                        #dt
                        [value]="store.reglas()"
                        [loading]="store.loading()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [paginator]="true"
                        [rows]="pageSize()"
                        [totalRecords]="store.totalRecords()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} reglas"
                        [rowsPerPageOptions]="[10, 25, 50]"
                        [tableStyle]="{ 'min-width': '60rem' }"
                        styleClass="p-datatable-gridlines"
                        [rowHover]="true"
                        dataKey="id"
                    >
                        <ng-template #caption>
                            <div class="flex flex-col md:flex-row items-center justify-between gap-3 py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">Reglas de Categorización</h5>
                                <p-iconfield class="w-full md:w-auto">
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [ngModel]="searchTerm()" (input)="onSearchChange($event)" placeholder="Buscar reglas..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="prioridad" style="width:6rem">Prior. <p-sortIcon field="prioridad" /></th>
                                <th pSortableColumn="patron" style="min-width:12rem">Patrón <p-sortIcon field="patron" /></th>
                                <th style="width:6rem">Tipo</th>
                                <th pSortableColumn="categoriaNombre" style="min-width:10rem">Categoría <p-sortIcon field="categoriaNombre" /></th>
                                <th style="min-width:9rem">Concepto / Proveedor</th>
                                <th style="width:6rem">Activa</th>
                                <th style="width:8rem">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-regla>
                            <tr>
                                <td class="text-center">{{ regla.prioridad }}</td>
                                <td><span class="font-mono text-sm">{{ regla.patron }}</span></td>
                                <td>
                                    @if (regla.tipo === 'gasto') {
                                        <p-tag severity="danger" value="Gasto" />
                                    } @else if (regla.tipo === 'ingreso') {
                                        <p-tag severity="success" value="Ingreso" />
                                    } @else {
                                        <p-tag severity="info" value="Ambos" />
                                    }
                                </td>
                                <td class="font-semibold">{{ regla.categoriaNombre }}</td>
                                <td class="text-500 text-sm">
                                    {{ regla.conceptoNombre || '—' }}
                                    @if (regla.proveedorNombre) { · {{ regla.proveedorNombre }} }
                                </td>
                                <td class="text-center">
                                    <p-toggleswitch [ngModel]="regla.activo" (ngModelChange)="onToggleActivo(regla, $event)" />
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editRegla(regla)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteRegla(regla)" />
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="7" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-filter-slash text-500 text-5xl mb-3"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">No hay reglas de categorización</p>
                                        <p class="text-600 mb-4">Crea tu primera regla para que Kash clasifique tus movimientos importados automáticamente.</p>
                                        <p-button label="Crear Regla" icon="pi pi-plus" (onClick)="openNew()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                    } @else {
                    <p-dataView
                        styleClass="kash-mobile-dataview"
                        [value]="store.reglas()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [rows]="pageSize()"
                        [totalRecords]="store.totalRecords()"
                        [paginator]="true"
                        [loading]="store.loading()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                    >
                        <ng-template #header>
                            <div class="flex flex-col gap-3 py-2">
                                <h5 class="m-0 font-semibold text-lg">Reglas de Categorización</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [ngModel]="searchTerm()" (input)="onSearchChange($event)" placeholder="Buscar reglas..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #list let-reglas>
                            <div class="flex flex-col gap-4 pt-4">
                                @for (regla of reglas; track regla.id) {
                                    <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-primary shadow-sm p-4">
                                        <div class="flex justify-between items-center gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                            <span class="font-semibold text-base text-900 flex items-center gap-2 min-w-0">
                                                <span class="font-mono text-sm truncate">{{ regla.patron }}</span>
                                            </span>
                                            @if (regla.tipo === 'gasto') {
                                                <p-tag severity="danger" value="Gasto" />
                                            } @else if (regla.tipo === 'ingreso') {
                                                <p-tag severity="success" value="Ingreso" />
                                            } @else {
                                                <p-tag severity="info" value="Ambos" />
                                            }
                                        </div>

                                        <div class="flex flex-col gap-2 py-3 text-sm">
                                            <div class="flex justify-between gap-3">
                                                <span class="text-500">Prioridad</span>
                                                <span class="font-medium text-900">{{ regla.prioridad }}</span>
                                            </div>
                                            <div class="flex justify-between gap-3">
                                                <span class="text-500">Categoría</span>
                                                <span class="font-semibold text-900 text-right truncate">{{ regla.categoriaNombre }}</span>
                                            </div>
                                            <div class="flex justify-between gap-3">
                                                <span class="text-500">Concepto / Proveedor</span>
                                                <span class="text-900 text-right truncate">
                                                    {{ regla.conceptoNombre || '—' }}
                                                    @if (regla.proveedorNombre) { · {{ regla.proveedorNombre }} }
                                                </span>
                                            </div>
                                            <div class="flex justify-between items-center gap-3">
                                                <span class="text-500">Activa</span>
                                                <p-toggleswitch [ngModel]="regla.activo" (ngModelChange)="onToggleActivo(regla, $event)" />
                                            </div>
                                        </div>

                                        <div class="flex justify-end gap-2 pt-3 border-t border-surface-200 dark:border-surface-700">
                                            <p-button icon="pi pi-pencil" label="Editar" severity="secondary" [outlined]="true" size="small" (click)="editRegla(regla)" />
                                            <p-button icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" size="small" (click)="deleteRegla(regla)" />
                                        </div>
                                    </div>
                                }
                            </div>
                        </ng-template>

                        <ng-template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-filter-slash text-500 text-5xl mb-3"></i>
                                <p class="text-900 font-semibold text-xl mb-2">No hay reglas de categorización</p>
                                <p class="text-600 mb-4">Crea tu primera regla para que Kash clasifique tus movimientos importados automáticamente.</p>
                                <p-button label="Crear Regla" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </ng-template>
                    </p-dataView>
                    }

                    <app-regla-categorizacion-form-modal
                        [visible]="dialogVisible()"
                        [regla]="currentRegla()"
                        [loading]="store.loading()"
                        (visibleChange)="dialogVisible.set($event)"
                        (save)="onSaveRegla($event)"
                        (cancel)="hideDialog()"
                    />
                </div>
            </div>
        </app-base-page-template>
    `
})
export class ReglasCategorizacionListPage extends BasePageComponent {
    store = inject(ReglaCategorizacionStore);
    protected readonly layout = inject(LayoutService);
    protected override loadingSignal = this.store.loading;
    protected override skeletonType = 'table' as const;

    @ViewChild('dt') dt!: Table;

    dialogVisible = signal(false);
    currentRegla = signal<Partial<ReglaCategorizacion> | null>(null);
    private searchSubject = new Subject<string>();

    pageSize = signal(10);
    pageNumber = signal(1);
    searchTerm = signal('');
    sortColumn = signal('prioridad');
    sortOrder = signal('asc');

    constructor() {
        super();

        this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((value) => {
            this.searchTerm.set(value);
            this.pageNumber.set(1);
            this.reload();
        });

        effect(() => {
            this.store.lastUpdated();
        });
    }

    onLazyLoad(event: any): void {
        this.pageNumber.set(event.first / event.rows + 1);
        this.pageSize.set(event.rows);
        if (event.sortField) {
            this.sortColumn.set(event.sortField);
            this.sortOrder.set(event.sortOrder === 1 ? 'asc' : 'desc');
        }
        this.reload();
    }

    onSearchChange(event: Event): void {
        this.searchSubject.next((event.target as HTMLInputElement).value);
    }

    private reload(): void {
        this.store.loadReglasPaginated({
            page: this.pageNumber(),
            pageSize: this.pageSize(),
            searchTerm: this.searchTerm() || undefined,
            sortColumn: this.sortColumn() || undefined,
            sortOrder: this.sortOrder() || undefined
        });
    }

    refreshTable(): void {
        this.reload();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    openNew(): void {
        this.currentRegla.set(null);
        this.dialogVisible.set(true);
    }

    editRegla(regla: ReglaCategorizacion): void {
        this.currentRegla.set({ ...regla });
        this.dialogVisible.set(true);
    }

    hideDialog(): void {
        this.dialogVisible.set(false);
        this.currentRegla.set(null);
    }

    async onSaveRegla(payload: ReglaCategorizacionCreate & { id?: string }): Promise<void> {
        const { id, ...regla } = payload;
        try {
            if (id) {
                await this.store.update(id, regla);
                this.showSuccess('Regla actualizada correctamente');
            } else {
                await this.store.create(regla);
                this.showSuccess('Regla creada correctamente');
            }
            this.hideDialog();
            this.reload();
        } catch (error: any) {
            this.showError(error.userMessage || 'Error al guardar la regla');
        }
    }

    async onToggleActivo(regla: ReglaCategorizacion, activo: boolean): Promise<void> {
        try {
            await this.store.update(regla.id, {
                patron: regla.patron,
                tipo: regla.tipo,
                categoriaNombre: regla.categoriaNombre,
                conceptoNombre: regla.conceptoNombre,
                proveedorNombre: regla.proveedorNombre,
                formaPagoNombre: regla.formaPagoNombre,
                prioridad: regla.prioridad,
                activo
            });
        } catch (error: any) {
            this.showError(error.userMessage || 'Error al actualizar la regla');
            this.reload();
        }
    }

    deleteRegla(regla: ReglaCategorizacion): void {
        this.confirmAction(
            `¿Eliminar la regla para "${regla.patron}"?`,
            () => {
                this.store.deleteRegla(regla.id);
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: 'Regla eliminada correctamente'
            }
        );
    }
}
