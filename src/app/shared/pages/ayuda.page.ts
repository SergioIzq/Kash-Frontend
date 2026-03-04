import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

@Component({
    selector: 'app-ayuda',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, DividerModule],
    template: `
        <div class="card">
            <h3 class="mb-4">
                <i class="pi pi-question-circle mr-2"></i>
                Centro de Ayuda
            </h3>
            <p class="text-700 line-height-3 mb-5">Bienvenido al centro de ayuda de Kash. Aquí encontrarás toda la información necesaria para aprovechar al máximo la aplicación de gestión financiera personal.</p>

            <p-divider></p-divider>

            <div class="contenedor-cards mt-4">
                <p-card class="mb-4">
                    <ng-template pTemplate="header">
                        <div class="flex align-items-center gap-3 p-3">
                            <div>
                                <h4 class="m-0">
                                    <i class="pi pi-file-pdf text-3xl text-red-500 mr-2"></i>
                                    Guía de Usuario
                                </h4>
                                <small class="text-600">Manual completo de la aplicación</small>
                            </div>
                        </div>
                    </ng-template>
                    <p class="line-height-3 mt-0 mb-3">Descarga el manual completo con instrucciones detalladas sobre todas las funcionalidades de Kash.</p>
                    <ng-template pTemplate="footer">
                        <div class="flex flex-wrap gap-2">
                            <p-button label="Descargar PDF" icon="pi pi-download" severity="success" (onClick)="descargarGuia()"> </p-button>
                            <p-button label="Ver en línea" icon="pi pi-external-link" severity="info" [outlined]="true" (onClick)="verGuia()"> </p-button>
                        </div>
                    </ng-template>
                </p-card>

                <p-card>
                    <ng-template pTemplate="header">
                        <div class="flex align-items-start gap-2 p-3">
                            <div>
                                <h4 class="m-0">
                                    <i class="pi pi-book text-3xl text-blue-500 mr-2"></i>
                                    Contenido de la Guía
                                </h4>
                                <small class="text-600">Temas incluidos</small>
                            </div>
                        </div>
                    </ng-template>
                    <ul class="list-none p-0 m-0">
                        <li class="flex align-items-center gap-2 mb-3">
                            <i class="pi pi-check-circle text-green-500"></i>
                            <span>Introducción y primeros pasos</span>
                        </li>
                        <li class="flex align-items-center gap-2 mb-3">
                            <i class="pi pi-check-circle text-green-500"></i>
                            <span>Panel de control (Dashboard)</span>
                        </li>
                        <li class="flex align-items-center gap-2 mb-3">
                            <i class="pi pi-check-circle text-green-500"></i>
                            <span>Configuración inicial</span>
                        </li>
                        <li class="flex align-items-center gap-2 mb-3">
                            <i class="pi pi-check-circle text-green-500"></i>
                            <span>Gestión de contactos</span>
                        </li>
                        <li class="flex align-items-center gap-2 mb-3">
                            <i class="pi pi-check-circle text-green-500"></i>
                            <span>Operaciones financieras</span>
                        </li>
                        <li class="flex align-items-center gap-2 mb-2">
                            <i class="pi pi-check-circle text-green-500"></i>
                            <span>Automatización y programación</span>
                        </li>
                    </ul>
                </p-card>
            </div>

            <p-divider></p-divider>

            <div class="mt-4">
                <h4 class="mb-4">
                    <i class="pi pi-info-circle mr-2"></i>
                    Información Adicional
                </h4>

                <div class="info-adicional-container">
                    <div class="info-card">
                        <div class="surface-card p-4 border-round">
                            <div class="flex align-items-center gap-3">
                                <i class="pi pi-calendar text-2xl text-primary"></i>
                                <div>
                                    <div class="font-semibold">Versión</div>
                                    <div class="text-600">1.0</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="info-card">
                        <div class="surface-card p-4 border-round">
                            <div class="flex align-items-center gap-3">
                                <i class="pi pi-clock text-2xl text-primary"></i>
                                <div>
                                    <div class="font-semibold">Última actualización</div>
                                    <div class="text-600">Marzo 2026</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="info-card">
                        <div class="surface-card p-4 border-round">
                            <div class="flex align-items-center gap-3">
                                <i class="pi pi-file text-2xl text-primary"></i>
                                <div>
                                    <div class="font-semibold">Formato</div>
                                    <div class="text-600">PDF</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host ::ng-deep {
                .contenedor-cards {
                    width: 100%;
                }

                .p-card {
                    width: 100%;
                    max-width: 100%;
                    box-sizing: border-box;
                }

                .p-card .p-card-body {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                }

                .p-card .p-card-content {
                    flex: 1;
                    width: 100%;
                }

                .info-adicional-container {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    width: 100%;
                }

                @media (min-width: 768px) {
                    .info-adicional-container {
                        flex-direction: row;
                    }

                    .info-card {
                        flex: 1;
                    }
                }

                .info-card {
                    width: 100%;
                }

                .surface-card {
                    width: 100%;
                    box-sizing: border-box;
                }
            }
        `
    ]
})
export class AyudaPage {
    descargarGuia() {
        const link = document.createElement('a');
        link.href = '/guia-usuario-Kash.pdf';
        link.download = 'Guia-Usuario-Kash.pdf';
        link.click();
    }

    verGuia() {
        window.open('/guia-usuario-Kash.pdf', '_blank');
    }
}
