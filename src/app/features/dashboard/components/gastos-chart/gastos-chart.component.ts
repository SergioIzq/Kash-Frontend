import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardStore } from '../../stores/dashboard.store';

@Component({
    selector: 'app-gastos-chart',
    standalone: true,
    imports: [CommonModule, CardModule, ChartModule, SkeletonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="surface-card shadow-2 border-round p-4">
            <div class="flex items-center justify-between mb-3">
                <h5 class="text-900 font-semibold m-0">Gastos por Categoría</h5>
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
                    <p-chart type="pie" [data]="chartData()" [options]="chartOptions" styleClass="w-full" style="height: 100%"></p-chart>
                </div>
                
                <!-- Leyenda personalizada -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    @for (item of categorias(); track item.categoria) {
                        <div>
                            <div class="surface-100 border-round p-3">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <div class="rounded-full" [style.background-color]="item.color" style="width:1rem;height:1rem"></div>
                                        <span class="text-900 font-medium">{{ item.categoria }}</span>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-900 font-bold">{{ item.total | currency:'EUR':'symbol':'1.0-0' }}</div>
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
                    <p class="text-600 m-0">No hay gastos registrados en este período</p>
                </div>
            }
        </div>
    `
})
export class GastosChartComponent {
    dashboardStore = inject(DashboardStore);

    // Colores predefinidos para las categorías
    private readonly colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];

    chartOptions = {
        plugins: {
            legend: {
                display: false // Usamos leyenda personalizada
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
        const categorias = this.dashboardStore.topCategoriasGastos();
        return categorias && categorias.length > 0;
    });

    categorias = computed(() => {
        const categorias = this.dashboardStore.topCategoriasGastos();
        if (!categorias || categorias.length === 0) return [];

        const total = categorias.reduce((sum: number, cat) => sum + cat.totalGastado, 0);

        return categorias.map((cat, index) => ({
            categoria: cat.categoriaNombre,
            total: cat.totalGastado,
            porcentaje: cat.porcentajeDelTotal,
            color: this.colors[index % this.colors.length]
        }));
    });

    chartData = computed(() => {
        const cats = this.categorias();
        return {
            labels: cats.map(c => c.categoria),
            datasets: [
                {
                    data: cats.map(c => c.total),
                    backgroundColor: cats.map(c => c.color),
                    hoverBackgroundColor: cats.map(c => c.color)
                }
            ]
        };
    });
}
