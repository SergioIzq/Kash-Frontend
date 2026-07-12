import { Component, inject, signal, computed, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';

import { ReporteService } from '@/core/services/api/reporte.service';
import { BasePageTemplateComponent } from '@/shared/components';

type Preset = 'mes' | 'mesAnterior' | 'anio' | 'personalizado';

@Component({
    selector: 'app-reportes-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        DatePickerModule,
        SelectButtonModule,
        BasePageTemplateComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        .preview-frame {
            width: 100%;
            height: 70vh;
            min-height: 480px;
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            background: var(--surface-ground);
        }
        .empty-preview {
            height: 70vh;
            min-height: 480px;
            border: 2px dashed var(--surface-400);
            border-radius: 8px;
        }
        /* Date picker a ancho completo: el wrapper es flex 100% y el input crece; el icono queda a la derecha */
        :host ::ng-deep p-datepicker { display: block; width: 100%; }
        :host ::ng-deep .p-datepicker { display: flex; width: 100%; }
        :host ::ng-deep .p-datepicker .p-datepicker-input,
        :host ::ng-deep .p-datepicker .p-inputtext { flex: 1 1 auto; min-width: 0; }
        /* Botonera de presets: se reparte el ancho y hace wrap, sin separación entre botones */
        :host ::ng-deep .p-selectbutton { display: flex; flex-wrap: wrap; width: 100%; }
        :host ::ng-deep .p-selectbutton .p-togglebutton { flex: 1 1 auto; justify-content: center; }
    `],
    template: `
        <app-base-page-template>
            <div class="card flex items-center justify-between flex-wrap gap-3 mb-5">
                <div>
                    <h1 class="text-900 font-bold text-3xl md:text-4xl m-0 mb-2">Informe de Presupuesto</h1>
                    <p class="text-600 text-lg m-0">Genera un PDF con el desglose de ingresos y gastos por categoría, concepto, cuenta y forma de pago.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <!-- Panel de controles -->
                <div class="lg:col-span-1">
                    <div class="card shadow-2 h-full flex flex-col gap-4">
                        <h5 class="text-900 font-semibold text-xl m-0 flex items-center gap-2">
                            <i class="pi pi-sliders-h text-primary"></i> Período
                        </h5>

                        <p-selectButton
                            [options]="presets"
                            optionLabel="label"
                            optionValue="value"
                            [ngModel]="preset()"
                            (onChange)="onPresetChange($event.value)"
                            [allowEmpty]="false"
                            styleClass="flex flex-wrap" />

                        <div class="flex flex-col gap-2">
                            <label class="text-700 font-medium text-sm">Rango de fechas</label>
                            <p-datePicker
                                [ngModel]="rango()"
                                (ngModelChange)="onRangoChange($event)"
                                selectionMode="range"
                                dateFormat="dd/mm/yy"
                                [showIcon]="true"
                                [numberOfMonths]="2"
                                [readonlyInput]="true"
                                placeholder="Selecciona un rango"
                                appendTo="body"
                                styleClass="w-full" class="w-full" />
                        </div>

                        <div class="flex flex-col gap-2 mt-2">
                            <p-button
                                label="Generar informe"
                                icon="pi pi-file-pdf"
                                [loading]="generando()"
                                [disabled]="!rangoValido()"
                                (onClick)="generar()"
                                styleClass="w-full" />

                            <p-button
                                label="Descargar PDF"
                                icon="pi pi-download"
                                severity="secondary"
                                [outlined]="true"
                                [disabled]="!pdfBlob()"
                                (onClick)="descargar()"
                                styleClass="w-full" />
                        </div>

                        @if (!rangoValido()) {
                            <small class="text-500">Selecciona un rango de fechas completo (fecha de inicio y de fin).</small>
                        }
                    </div>
                </div>

                <!-- Previsualización -->
                <div class="lg:col-span-2">
                    <div class="card shadow-2 h-full">
                        @if (previewUrl()) {
                            <iframe class="preview-frame" [src]="previewUrl()" title="Previsualización del informe"></iframe>
                        } @else {
                            <div class="empty-preview flex flex-col items-center justify-center text-center gap-3 p-6">
                                @if (generando()) {
                                    <i class="pi pi-spin pi-spinner text-primary" style="font-size: 2.5rem"></i>
                                    <span class="text-600 text-lg">Generando informe…</span>
                                } @else {
                                    <i class="pi pi-file-pdf text-400" style="font-size: 3rem"></i>
                                    <span class="text-600 text-lg">Elige un período y pulsa «Generar informe» para ver la previsualización aquí.</span>
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        </app-base-page-template>
    `
})
export class ReportesPage implements OnDestroy {
    private readonly reporteService = inject(ReporteService);
    private readonly messageService = inject(MessageService);
    private readonly sanitizer = inject(DomSanitizer);

    readonly presets = [
        { label: 'Este mes', value: 'mes' as Preset },
        { label: 'Mes anterior', value: 'mesAnterior' as Preset },
        { label: 'Este año', value: 'anio' as Preset },
        { label: 'Personalizado', value: 'personalizado' as Preset }
    ];

    readonly preset = signal<Preset>('anio');
    // PrimeNG selectionMode="range" trabaja con un array [inicio, fin] (fin puede ser null mientras se elige).
    readonly rango = signal<Date[] | null>(null);
    readonly generando = signal(false);
    readonly pdfBlob = signal<Blob | null>(null);
    readonly previewUrl = signal<SafeResourceUrl | null>(null);

    readonly fechaInicio = computed(() => this.rango()?.[0] ?? null);
    readonly fechaFin = computed(() => this.rango()?.[1] ?? null);

    readonly rangoValido = computed(() => {
        const desde = this.fechaInicio();
        const hasta = this.fechaFin();
        return !!desde && !!hasta && desde.getTime() <= hasta.getTime();
    });

    private objectUrl: string | null = null;

    constructor() {
        this.aplicarPreset('anio');
    }

    ngOnDestroy(): void {
        this.revocarUrl();
    }

    onPresetChange(value: Preset): void {
        this.preset.set(value);
        if (value !== 'personalizado') {
            this.aplicarPreset(value);
        }
    }

    onRangoChange(rango: Date[] | null): void {
        this.rango.set(rango);
        this.preset.set('personalizado');
    }

    async generar(): Promise<void> {
        if (!this.rangoValido() || this.generando()) return;

        this.generando.set(true);
        try {
            const desde = this.toApiDate(this.fechaInicio()!);
            const hasta = this.toApiDate(this.fechaFin()!);

            const blob = await firstValueFrom(this.reporteService.descargarPresupuestoPdf(desde, hasta));

            this.revocarUrl();
            this.objectUrl = URL.createObjectURL(blob);
            this.pdfBlob.set(blob);
            this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
        } catch {
            this.messageService.add({
                severity: 'error',
                summary: 'No se pudo generar el informe',
                detail: 'Inténtalo de nuevo en unos instantes.'
            });
        } finally {
            this.generando.set(false);
        }
    }

    descargar(): void {
        const blob = this.pdfBlob();
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = this.nombreArchivo();
        enlace.click();
        URL.revokeObjectURL(url);
    }

    private aplicarPreset(value: Preset): void {
        const hoy = new Date();
        const y = hoy.getFullYear();
        const m = hoy.getMonth();

        switch (value) {
            case 'mes':
                this.rango.set([new Date(y, m, 1), new Date(y, m + 1, 0)]);
                break;
            case 'mesAnterior':
                this.rango.set([new Date(y, m - 1, 1), new Date(y, m, 0)]);
                break;
            case 'anio':
                this.rango.set([new Date(y, 0, 1), new Date(y, 11, 31)]);
                break;
        }
    }

    private nombreArchivo(): string {
        return `presupuesto_${this.toFileStamp(this.fechaInicio()!)}_${this.toFileStamp(this.fechaFin()!)}.pdf`;
    }

    private toApiDate(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    private toFileStamp(d: Date): string {
        return this.toApiDate(d).replace(/-/g, '');
    }

    private revocarUrl(): void {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }
}
