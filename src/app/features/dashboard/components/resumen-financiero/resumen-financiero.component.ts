import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardStore } from '../../stores/dashboard.store';

@Component({
    selector: 'app-resumen-financiero',
    standalone: true,
    imports: [CommonModule, CardModule, SkeletonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            @if (dashboardStore.loading()) {
                @for (item of [1, 2, 3, 4]; track item) {
                    <div>
                        <div class="surface-card shadow-2 border-round p-4 h-full">
                            <div class="flex justify-between items-start mb-3">
                                <div class="flex-1">
                                    <p-skeleton width="60%" height="1rem" styleClass="mb-2"></p-skeleton>
                                    <p-skeleton width="80%" height="2rem" styleClass="mb-2"></p-skeleton>
                                </div>
                                <p-skeleton shape="circle" size="3rem"></p-skeleton>
                            </div>
                            <p-skeleton width="50%" height="0.8rem"></p-skeleton>
                        </div>
                    </div>
                }
            }

            @else if (dashboardStore.error()) {
                <div class="col-span-full">
                    <div class="surface-card shadow-2 border-round p-4 border-l-4 border-red-500">
                        <div class="flex items-center">
                            <i class="pi pi-exclamation-triangle text-red-500 text-2xl mr-3"></i>
                            <div>
                                <p class="font-semibold text-900 mb-1">Error al cargar los datos</p>
                                <p class="text-600 m-0">{{ dashboardStore.error() }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            }

            @else {
                <div>
                    <div class="surface-card shadow-2 border-round p-4 h-full">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-2">Ingresos del Mes</span>
                                <div class="text-900 font-bold text-3xl">{{ totalIngresos() | currency: 'EUR' : 'symbol' : '1.0-0' }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-green-100 rounded" style="width:3rem;height:3rem">
                                <i class="pi pi-arrow-up text-green-500 text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-500 text-sm">{{ cantidadIngresos() }} movimientos</span>
                    </div>
                </div>

                <div>
                    <div class="surface-card shadow-2 border-round p-4 h-full">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-2">Gastos del Mes</span>
                                <div class="text-900 font-bold text-3xl">{{ totalGastos() | currency: 'EUR' : 'symbol' : '1.0-0' }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-red-100 rounded" style="width:3rem;height:3rem">
                                <i class="pi pi-arrow-down text-red-500 text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-500 text-sm">{{ cantidadGastos() }} movimientos</span>
                    </div>
                </div>

                <div>
                    <div class="surface-card shadow-2 border-round p-4 h-full">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-2">Balance del Mes</span>
                                <div class="text-900 font-bold text-3xl">{{ balance() | currency: 'EUR' : 'symbol' : '1.0-0' }}</div>
                            </div>
                            <div class="flex items-center justify-center rounded" [class.bg-green-100]="balance() > 0" [class.bg-red-100]="balance() < 0" [class.bg-gray-100]="balance() === 0" style="width:3rem;height:3rem">
                                <i [class]="balanceIcon()" [class.text-green-500]="balance() > 0" [class.text-red-500]="balance() < 0" [class.text-gray-500]="balance() === 0" class="text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-500 text-sm">{{ estadoText() }}</span>
                    </div>
                </div>

                <div>
                    <div class="surface-card shadow-2 border-round p-4 h-full">
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <span class="block text-500 font-medium mb-2">Balance Total</span>
                                <div class="text-900 font-bold text-3xl">{{ dashboardStore.balanceTotal() | currency: 'EUR' : 'symbol' : '1.0-0' }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 rounded" style="width:3rem;height:3rem">
                                <i class="pi pi-wallet text-blue-500 text-2xl"></i>
                            </div>
                        </div>
                        <span class="text-500 text-sm">{{ dashboardStore.totalCuentas() }} cuentas</span>
                    </div>
                </div>
            }
        </div>
    `
})
export class ResumenFinancieroComponent {
    dashboardStore = inject(DashboardStore);

    // ... (El resto de tu lógica Typescript está perfecta, déjala igual)
    totalIngresos = computed(() => this.dashboardStore.ingresosMesActual());
    cantidadIngresos = computed(() => this.dashboardStore.ultimosMovimientos().filter((m) => m.tipo.toLowerCase() === 'ingreso').length);
    totalGastos = computed(() => this.dashboardStore.gastosMesActual());
    cantidadGastos = computed(() => this.dashboardStore.ultimosMovimientos().filter((m) => m.tipo.toLowerCase() === 'gasto').length);
    balance = computed(() => this.dashboardStore.balanceMesActual());
    
    estadoText = computed(() => {
        const balance = this.balance();
        if (balance > 0) return 'Superávit';
        if (balance < 0) return 'Déficit';
        return 'Equilibrado';
    });

    balanceIcon = computed(() => {
        const balance = this.balance();
        if (balance > 0) return 'pi pi-check-circle';
        if (balance < 0) return 'pi pi-exclamation-circle';
        return 'pi pi-minus-circle';
    });
}