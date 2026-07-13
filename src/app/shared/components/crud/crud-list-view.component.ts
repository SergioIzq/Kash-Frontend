import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { LayoutService } from '@/layout/service/layout.service';
import { BasePageTemplateComponent } from '../base/base-page-template.component';
import { HelpGlossaryComponent } from '../help-glossary.component';
import { CrudColumn, CrudListConfig, ListLazyLoadEvent } from './crud-list.types';

/**
 * Vista de listado CRUD reutilizable (presentacional).
 *
 * Renderiza el toolbar + tabla (desktop) + dataview (móvil) + estados vacíos y
 * de carga a partir de una {@link CrudListConfig}. No contiene lógica de
 * negocio: emite eventos que la página (ver {@link BaseCrudListPage}) traduce a
 * llamadas al store. El modal de alta/edición se proyecta vía `<ng-content>`.
 */
@Component({
    selector: 'app-crud-list-view',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TableModule,
        InputTextModule,
        ToolbarModule,
        InputIconModule,
        IconFieldModule,
        SkeletonModule,
        TooltipModule,
        DataViewModule,
        TagModule,
        BasePageTemplateComponent,
        HelpGlossaryComponent
    ],
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
        <app-base-page-template [loading]="loading()" [skeletonType]="'table'">
            <div class="card surface-ground px-4 py-5 md:px-6 lg:px-8">
                <div class="surface-card shadow-2 border-round p-6">

                    <p-toolbar styleClass="mb-6 gap-2 p-6">
                        <ng-template #start>
                            <p-button [label]="config().newLabel" icon="pi pi-plus" severity="secondary" class="mr-2" (onClick)="newItem.emit()" />
                        </ng-template>

                        <ng-template #end>
                            @if (config().glossary) {
                                <app-help-glossary [config]="config().glossary!" class="mr-2" />
                            }
                            <p-button icon="pi pi-refresh" severity="secondary" outlined (onClick)="refreshList.emit()" pTooltip="Actualizar" />
                        </ng-template>
                    </p-toolbar>

                    @if (!layout.isMobileView()) {
                    <p-table
                        [value]="items()"
                        [loading]="loading()"
                        [lazy]="true"
                        (onLazyLoad)="lazyLoad.emit($event)"
                        [paginator]="true"
                        [rows]="pageSize()"
                        [totalRecords]="totalRecords()"
                        [showCurrentPageReport]="true"
                        [currentPageReportTemplate]="'Mostrando {first} a {last} de {totalRecords} ' + config().countLabel"
                        [rowsPerPageOptions]="[10, 25, 50]"
                        [tableStyle]="{ 'min-width': '50rem' }"
                        styleClass="p-datatable-gridlines"
                        [rowHover]="true"
                        dataKey="id"
                    >
                        <ng-template #caption>
                            <div class="flex flex-col md:flex-row items-center justify-between gap-3 py-3 px-4">
                                <h5 class="m-0 font-semibold text-xl">{{ config().title }}</h5>
                                <p-iconfield class="w-full md:w-auto">
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [ngModel]="searchValue()" (input)="onSearchInput($event)" [placeholder]="config().searchPlaceholder" class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #header>
                            <tr>
                                <th pSortableColumn="{{ titleField() }}" style="min-width:20rem; padding: 1rem">
                                    Nombre
                                    <p-sortIcon [field]="titleField()" />
                                </th>
                                @for (col of columns(); track col.field) {
                                    @if (col.sortable) {
                                        <th [pSortableColumn]="col.field" [style.min-width]="col.minWidth || '12rem'">
                                            {{ col.header }}
                                            <p-sortIcon [field]="col.field" />
                                        </th>
                                    } @else {
                                        <th [style.min-width]="col.minWidth || '12rem'">{{ col.header }}</th>
                                    }
                                }
                                <th style="min-width:10rem">Acciones</th>
                            </tr>
                        </ng-template>

                        <ng-template #body let-row>
                            <tr>
                                <td style="padding: 1rem">
                                    <div class="flex items-center gap-2">
                                        <i [class]="config().icon + ' text-primary'"></i>
                                        <span class="font-semibold">{{ row[titleField()] }}</span>
                                    </div>
                                </td>
                                @for (col of columns(); track col.field) {
                                    <td>
                                        @if (col.type === 'tag') {
                                            <p-tag [value]="cellValue(col, row)" [severity]="col.severity ? col.severity(row) : 'info'" [rounded]="true" />
                                        } @else {
                                            {{ cellValue(col, row) }}
                                        }
                                    </td>
                                }
                                <td>
                                    <p-button icon="pi pi-pencil" class="mr-2" [rounded]="true" [outlined]="true" (click)="editItem.emit(row)" pTooltip="Editar" />
                                    <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (click)="deleteItem.emit(row)" pTooltip="Eliminar" />
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template #loadingbody>
                            <tr>
                                <td style="padding: 1rem"><p-skeleton width="80%" /></td>
                                @for (col of columns(); track col.field) {
                                    <td><p-skeleton width="70%" /></td>
                                }
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
                                <td [attr.colspan]="colspan()" style="padding: 2rem">
                                    <div class="text-center py-8">
                                        <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                        <p class="text-900 font-semibold text-xl mb-2">{{ config().emptyTitle }}</p>
                                        <p class="text-600 mb-4">{{ config().emptySubtitle }}</p>
                                        <p-button [label]="config().createLabel" icon="pi pi-plus" (onClick)="newItem.emit()" />
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                    } @else {
                    <p-dataView
                        styleClass="kash-mobile-dataview"
                        [value]="items()"
                        [lazy]="true"
                        (onLazyLoad)="lazyLoad.emit($event)"
                        [rows]="pageSize()"
                        [totalRecords]="totalRecords()"
                        [paginator]="true"
                        [loading]="loading()"
                        [showCurrentPageReport]="true"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                    >
                        <ng-template #header>
                            <div class="flex flex-col gap-3 py-2">
                                <h5 class="m-0 font-semibold text-lg">{{ config().title }}</h5>
                                <p-iconfield>
                                    <p-inputicon styleClass="pi pi-search" />
                                    <input pInputText type="text" [ngModel]="searchValue()" (input)="onSearchInput($event)" placeholder="Buscar..." class="w-full" />
                                </p-iconfield>
                            </div>
                        </ng-template>

                        <ng-template #list let-rows>
                            <div class="flex flex-col gap-4 pt-4">
                                @for (row of rows; track row.id) {
                                    <div class="surface-card rounded-xl border border-surface-200 dark:border-surface-700 border-l-4 border-l-primary shadow-sm p-4">
                                        <div class="flex justify-between items-center gap-3 pb-3 border-b border-surface-200 dark:border-surface-700">
                                            <span class="font-semibold text-base text-900 flex items-center gap-2 min-w-0">
                                                <i [class]="config().icon + ' text-primary'"></i><span class="truncate">{{ row[titleField()] }}</span>
                                            </span>
                                            @for (col of columns(); track col.field) {
                                                @if (col.type === 'tag') {
                                                    <p-tag [value]="cellValue(col, row)" [severity]="col.severity ? col.severity(row) : 'info'" [rounded]="true" />
                                                }
                                            }
                                        </div>

                                        <div class="flex justify-end gap-2 pt-3">
                                            <p-button icon="pi pi-pencil" label="Editar" severity="secondary" [outlined]="true" size="small" (click)="editItem.emit(row)" />
                                            <p-button icon="pi pi-trash" label="Eliminar" severity="danger" [outlined]="true" size="small" (click)="deleteItem.emit(row)" />
                                        </div>
                                    </div>
                                }
                            </div>
                        </ng-template>

                        <ng-template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-inbox text-500 text-5xl mb-3"></i>
                                <p class="text-900 font-semibold text-xl mb-2">{{ config().emptyTitle }}</p>
                                <p class="text-600 mb-4">{{ config().emptySubtitle }}</p>
                                <p-button [label]="config().createLabel" icon="pi pi-plus" (onClick)="newItem.emit()" />
                            </div>
                        </ng-template>
                    </p-dataView>
                    }

                    <ng-content></ng-content>
                </div>
            </div>
        </app-base-page-template>
    `
})
export class CrudListViewComponent<T extends { id: string }> {
    protected readonly layout = inject(LayoutService);

    // Inputs
    readonly config = input.required<CrudListConfig<T>>();
    readonly items = input.required<T[]>();
    readonly totalRecords = input.required<number>();
    readonly loading = input.required<boolean>();
    readonly pageSize = input<number>(10);
    readonly searchValue = input<string>('');

    // Outputs
    readonly lazyLoad = output<ListLazyLoadEvent>();
    readonly search = output<string>();
    readonly newItem = output<void>();
    readonly editItem = output<T>();
    readonly deleteItem = output<T>();
    readonly refreshList = output<void>();

    protected readonly titleField = computed(() => this.config().titleField ?? 'nombre');
    protected readonly columns = computed(() => this.config().columns ?? []);
    protected readonly colspan = computed(() => this.columns().length + 2);

    protected cellValue(col: CrudColumn<T>, row: T): string {
        if (col.value) {
            return col.value(row);
        }
        const raw = (row as Record<string, unknown>)[col.field];
        return raw == null ? '' : String(raw);
    }

    protected onSearchInput(event: Event): void {
        this.search.emit((event.target as HTMLInputElement).value);
    }
}
