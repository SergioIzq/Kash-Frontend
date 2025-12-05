import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DashboardStore } from '../stores/dashboard.store';
import { AuthStore } from '../../../core/stores/auth.store';
import { ResumenFinancieroComponent } from '../components/resumen-financiero/resumen-financiero.component';
import { GastosChartComponent } from '../components/gastos-chart/gastos-chart.component';
import { IngresosChartComponent } from '../components/ingresos-chart/ingresos-chart.component';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';

@Component({
    selector: 'app-dashboard-page',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonModule, ResumenFinancieroComponent, GastosChartComponent, IngresosChartComponent, BasePageTemplateComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <app-base-page-template [loading]="dashboardStore.loading()" [skeletonType]="'card'">
            <!-- Header -->
            <div class="card flex items-center justify-between flex-wrap gap-3 mb-5">
                <div>
                    <h1 class="text-900 font-bold text-3xl md:text-4xl m-0 mb-2">Panel de Control</h1>
                    <p class="text-600 text-lg m-0">Bienvenido, {{ authStore.userName() || 'Usuario' }}</p>
                </div>
                <div>
                    <p-button label="Actualizar" icon="pi pi-refresh" severity="info" [loading]="dashboardStore.loading()" (click)="dashboardStore.refresh()"> </p-button>
                </div>
            </div>

            <!-- Resumen Financiero (4 cards en fila) -->
            <app-resumen-financiero class="mb-4" />

            <!-- Charts -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div>
                    <app-gastos-chart />
                </div>

                <div>
                    <app-ingresos-chart />
                </div>
            </div>

            <!-- Información adicional -->
            <div class="card shadow-2 border-round p-4 mt-4">
                <h5 class="text-900 font-semibold text-xl mb-4">Estadísticas del Mes</h5>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="surface-border border-round p-4">
                        <div class="text-center">
                            <i class="pi pi-calendar text-primary mb-3" style="font-size: 2.5rem"></i>
                            <div class="text-900 font-bold text-2xl mb-2">{{ dashboardStore.diasTranscurridosMes() }} / {{ dashboardStore.diasTranscurridosMes() + dashboardStore.diasRestantesMes() }}</div>
                            <div class="text-600 text-sm">Días transcurridos</div>
                        </div>
                    </div>

                    <div class="surface-border border-round p-4">
                        <div class="text-center">
                            <i class="pi pi-chart-line text-orange-500 mb-3" style="font-size: 2.5rem"></i>
                            <div class="text-900 font-bold text-2xl mb-2">
                                {{ dashboardStore.gastoPromedioDiario() | currency: 'EUR' : 'symbol' : '1.0-0' }}
                            </div>
                            <div class="text-600 text-sm">Gasto promedio diario</div>
                        </div>
                    </div>

                    <div class="surface-border border-round p-4">
                        <div class="text-center">
                            <i class="pi pi-chart-bar text-cyan-500 mb-3" style="font-size: 2.5rem"></i>
                            <div class="text-900 font-bold text-2xl mb-2">
                                {{ dashboardStore.proyeccionGastosFinMes() | currency: 'EUR' : 'symbol' : '1.0-0' }}
                            </div>
                            <div class="text-600 text-sm">Proyección fin de mes</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card shadow-2 border-round p-4 mt-4">
                <h5 class="text-900 font-semibold text-xl mb-4">Acciones Rápidas</h5>
                <div class="flex flex-wrap gap-3">
                    <p-button label="Nuevo Gasto" icon="pi pi-plus" severity="danger" [routerLink]="['/gastos']"> </p-button>
                    <p-button label="Nuevo Ingreso" icon="pi pi-plus" severity="success" [routerLink]="['/ingresos']"> </p-button>
                    <p-button label="Ver Gastos" icon="pi pi-list" [outlined]="true" [routerLink]="['/gastos']"> </p-button>
                    <p-button label="Ver Ingresos" icon="pi pi-list" [outlined]="true" [routerLink]="['/ingresos']"> </p-button>
                </div>
            </div>
        </app-base-page-template>
    `
})
export class DashboardPage extends BasePageComponent {
    dashboardStore = inject(DashboardStore);
    authStore = inject(AuthStore);

    protected override loadingSignal = this.dashboardStore.loading;
    protected override skeletonType = 'card' as const;
}
