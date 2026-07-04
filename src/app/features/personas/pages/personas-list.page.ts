import { Component, inject, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DataViewModule } from 'primeng/dataview';
import { PersonaStore } from '../store/persona.store';
import { Persona } from '@/core/models/persona.model';
import { PersonaFormModalComponent } from '../components/persona-form-modal.component';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';
import { HelpGlossaryComponent, GlossaryConfig } from '@/shared/components/help-glossary.component';
import { LayoutService } from '@/layout/service/layout.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-personas-list-page',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, TableModule, ToolbarModule, InputIconModule, IconFieldModule, SkeletonModule, TooltipModule, DataViewModule, PersonaFormModalComponent, BasePageTemplateComponent, HelpGlossaryComponent],
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
        <app-base-page-template [loading]="personaStore.loading()" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">

                    <p-toolbar class="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button label="Nueva Persona" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="openNew()" />
                        </ng-template>

                        <ng-template #end>
                            <app-help-glossary [config]="glossary" class="mr-2" />
                            <p-button icon="pi pi-refresh" severity="secondary" outlined (onClick)="refreshTable()" pTooltip="Actualizar" />
                        </ng-template>
                    </p-toolbar>

                    @if (!layout.isMobileView()) {
                    <p-table
                        #dt
                        [value]="personaStore.personas()"
                        [loading]="personaStore.loading()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [paginator]="true"
                        [rows]="pageSize"
                        [totalRecords]="personaStore.totalRecords()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} personas"
                        [rowsPerPageOptions]="[10, 25, 50]"
                        [tableStyle]="{ 'min-width': '50rem' }"
                        class="p-datatable-gridlines"
                        [rowHover]="true"
                        dataKey="id"
                        [sortField]="'nombre'"
                        [sortOrder]="1"
                    >
                        <ng-template #caption>
                            <div class="flex flex-col md:flex-row items-center justify-between gap-3 py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">Gestión de Personas</h5>
                                <p-iconfield class="w-full md:w-auto">
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange($event)" placeholder="Buscar personas..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="nombre" style="min-width:30rem; padding: 1rem">
                                    Nombre
                                    <p-sortIcon field="nombre" />
                                </th>
                                <th style="min-width:10rem">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-persona>
                            <tr>
                                <td style="padding: 1rem">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-user text-primary"></i>
                                        <span class="font-semibold">{{ persona.nombre }}</span>
                                    </div>
                                </td>
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editPersona(persona)" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deletePersona(persona)" />
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #loadingbody>
                            <tr>
                                <td style="padding: 1rem"><p-skeleton width="80%" /></td>
                                <td>
                                    <div class="flex gap-2">
                                        <p-skeleton shape="circle" size="2.5rem" />
                                        <p-skeleton shape="circle" size="2.5rem" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #emptymessage>
                            <tr>
                                <td colspan="8" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">No hay personas</p>
                                        <p class="text-600 mb-4">Comienza agregando tu primera persona</p>
                                        <p-button label="Crear Persona" icon="pi pi-plus" (onClick)="openNew()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                    } @else {
                    <p-dataView
                        styleClass="kash-mobile-dataview"
                        [value]="personaStore.personas()"
                        [lazy]="true"
                        (onLazyLoad)="onLazyLoad($event)"
                        [rows]="pageSize"
                        [totalRecords]="personaStore.totalRecords()"
                        [paginator]="true"
                        [loading]="personaStore.loading()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                    >
                        <ng-template #header>
                            <div class="flex flex-col gap-3 py-2">
                                <h5 class="m-0 font-semibold text-lg">Gestión de Personas</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange($event)" placeholder="Buscar..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #list let-personas>
                            <div class="flex flex-col gap-4 pt-4">
                                @for (persona of personas; track persona.id) {
                                    <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-primary shadow-sm p-4">
                                        <div class="flex justify-between items-center gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                            <span class="font-semibold text-base text-900 flex items-center gap-2 min-w-0">
                                                <i class="pi pi-user text-primary"></i><span class="truncate">{{ persona.nombre }}</span>
                                            </span>
                                        </div>

                                        <div class="flex justify-end gap-2 pt-3">
                                            <p-button icon="pi pi-pencil" label="Editar" severity="secondary" [outlined]="true" size="small" (click)="editPersona(persona)" />
                                            <p-button icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" size="small" (click)="deletePersona(persona)" />
                                        </div>
                                    </div>
                                }
                            </div>
                        </ng-template>

                        <ng-template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                <p class="text-900 font-semibold text-xl mb-2">No hay personas</p>
                                <p class="text-600 mb-4">Comienza agregando tu primera persona</p>
                                <p-button label="Crear Persona" icon="pi pi-plus" (onClick)="openNew()" />
                            </div>
                        </ng-template>
                    </p-dataView>
                    }

                    <app-persona-form-modal [visible]="personaDialog" [persona]="currentPersona" (visibleChange)="personaDialog = $event" (save)="onSavePersona($event)" (cancel)="hideDialog()" />
                </div>
            </div>
        </app-base-page-template>
    `
})
export class PersonasListPage extends BasePageComponent {
    personaStore = inject(PersonaStore);
    protected readonly layout = inject(LayoutService);

    protected override loadingSignal = this.personaStore.loading;
    protected override skeletonType = 'table' as const;

    @ViewChild('dt') dt!: Table;

    personaDialog: boolean = false;
    currentPersona: Partial<Persona> = {};
    private searchSubject = new Subject<string>();

    pageSize: number = 10;
    pageNumber: number = 1;
    searchTerm: string = '';
    sortColumn: string = 'nombre';
    sortOrder: string = 'asc';

    readonly glossary: GlossaryConfig = {
        title: 'Glosario · Personas',
        intro: 'Lista de personas que pueden relacionarse con movimientos o entidades del sistema.',
        sections: [
            {
                title: 'Acciones',
                rows: [
                    { term: 'Nueva Persona', def: 'Abre el formulario para crear una persona.' },
                    { term: 'Actualizar', def: 'Recarga el listado con los datos más recientes.' }
                ]
            },
            {
                title: 'Columnas',
                rows: [
                    { term: 'Nombre', def: 'Nombre de la persona registrada.' },
                    { term: 'Acciones', def: 'Permite editar o eliminar el registro.' }
                ]
            }
        ]
    };

    constructor() {
        super();
        // Configurar búsqueda con debounce de 500ms
        this.searchSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((searchValue) => {
            this.searchTerm = searchValue;
            this.pageNumber = 1; // Resetear a primera página en búsqueda
            this.reloadPersonas();
        });
    }

    /**
     * Manejar evento lazy load de la tabla (paginación + sort)
     */
    onLazyLoad(event: any) {
        this.pageNumber = event.first / event.rows + 1;
        this.pageSize = event.rows;

        // Manejar ordenamiento
        if (event.sortField) {
            this.sortColumn = event.sortField;
            this.sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
        }

        this.reloadPersonas();
    }

    /**
     * Manejar cambios en la búsqueda con debounce
     */
    onSearchChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value);
    }

    /**
     * Recargar personas con los filtros actuales
     */
    private reloadPersonas() {
        this.personaStore.loadPersonasPaginated({
            page: this.pageNumber,
            pageSize: this.pageSize,
            searchTerm: this.searchTerm || undefined,
            sortColumn: this.sortColumn || undefined,
            sortOrder: this.sortOrder || undefined
        });
    }

    loadPersonas() {
        this.reloadPersonas();
    }

    refreshTable() {
        this.pageNumber = 1;
        this.searchTerm = '';
        this.reloadPersonas();
        this.showInfo('Datos actualizados', 'Actualización');
    }

    openNew() {
        this.currentPersona = {};
        this.personaDialog = true;
    }

    hideDialog() {
        this.personaDialog = false;
        this.currentPersona = {};
    }

    async onSavePersona(persona: Partial<Persona>) {
        if (persona.id) {
            try {
                await this.personaStore.update(persona.id, persona);
                this.showSuccess('Persona actualizada correctamente');
                this.hideDialog();
            } catch (error: any) {
                this.showError(error.message || 'Error al actualizar la persona');
            }
        } else {
            try {
                await this.personaStore.create(persona.nombre!);
                this.showSuccess('Persona creada correctamente');
                this.hideDialog();
            } catch (error: any) {
                this.showError(error.message || 'Error al crear la persona');
            }
        }
    }

    editPersona(persona: Persona) {
        this.currentPersona = { ...persona };
        this.personaDialog = true;
    }

    deletePersona(persona: Persona) {
        this.confirmAction(
            `¿Estás seguro de eliminar la persona "${persona.nombre}"?`,
            () => {
                this.personaStore.deletePersona(persona.id);
            },
            {
                header: 'Confirmar eliminación',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                successMessage: 'Persona eliminada correctamente'
            }
        );
    }
}
