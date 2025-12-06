import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardStore } from '../../stores/dashboard.store';

@Component({
    selector: 'app-ingresos-chart',
    standalone: true,
    imports: [CommonModule, CardModule, ChartModule, SkeletonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="card shadow-2 border-round p-4">
            <div class="flex items-center justify-between mb-3">
                <h5 class="text-900 font-semibold m-0">Ingresos por Categoría</h5>
            </div>
            
            @if (dashboardStore.loading()) {
                <div class="flex justify-center mb-4">
                    <p-skeleton shape="circle" size="250px"></p-skeleton>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (item of [1,2,3,4]; track item) {
                        <div>
                            <div class="surface-100 border-round p-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2 flex-1">
                                        <p-skeleton shape="circle" size="1rem"></p-skeleton>
                                        <p-skeleton width="60%" height="1rem"></p-skeleton>
                                    </div>
                                    <div>
                                        <p-skeleton width="3rem" height="1.2rem" styleClass="mb-1"></p-skeleton>
                                        <p-skeleton width="2rem" height="0.8rem"></p-skeleton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            } @else if (hasData()) {
                <div class="flex justify-center mb-4" style="height: 300px">
                    <p-chart type="doughnut" [data]="chartData()" [options]="chartOptions" styleClass="w-full" style="height: 100%"></p-chart>
                </div>
                
                <!-- Leyenda personalizada -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (item of tipos(); track item.tipo) {
                        <div>
                            <div class="surface-100 border-round p-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <div class="rounded-full" [style.background-color]="item.color" style="width:1rem;height:1rem"></div>
                                        <span class="text-900 font-medium">{{ item.tipo }}</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-900 font-bold">{{ item.total | number:'1.0-0' }} €</div>
                                        <div class="text-500 text-sm">{{ item.porcentaje | number:'1.0-0' }}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="text-center py-6">
                    <i class="pi pi-chart-pie text-500 mb-3" style="font-size: 4rem"></i>
                    <p class="text-600 m-0">No hay ingresos registrados en este período</p>
                </div>
            }
        </div>
    `
})
export class IngresosChartComponent {
    dashboardStore = inject(DashboardStore);

    // Colores predefinidos para los tipos (tonos verdes)
    private readonly colors = [
        '#10B981', '#059669', '#34D399', '#6EE7B7', '#A7F3D0',
        '#D1FAE5', '#10B981', '#047857', '#065F46', '#064E3B'
    ];

    chartOptions = {
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value.toFixed(2)}€ (${percentage}%)`;
                    }
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    };

    hasData = computed(() => {
        const movimientos = this.dashboardStore.ultimosMovimientos();
        return movimientos && movimientos.filter(m => m.tipo.toLowerCase() === 'ingreso').length > 0;
    });

    tipos = computed(() => {
        const movimientos = this.dashboardStore.ultimosMovimientos();
        if (!movimientos || movimientos.length === 0) return [];

        const ingresos = movimientos.filter(m => m.tipo.toLowerCase() === 'ingreso');
        const tipoMap = new Map<string, number>();
        ingresos.forEach(ing => {
            const tipo = ing.categoria || 'Sin categoría';
            tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + ing.importe);
        });

        const total = Array.from(tipoMap.values()).reduce((sum, val) => sum + val, 0);

        return Array.from(tipoMap.entries()).map(([tipo, valor], index) => ({
            tipo,
            total: valor,
            porcentaje: total > 0 ? (valor / total) * 100 : 0,
            color: this.colors[index % this.colors.length]
        }));
    });

    chartData = computed(() => {
        const tps = this.tipos();
        return {
            labels: tps.map(t => t.tipo),
            datasets: [
                {
                    data: tps.map(t => t.total),
                    backgroundColor: tps.map(t => t.color),
                    hoverBackgroundColor: tps.map(t => t.color)
                }
            ]
        };
    });
}
