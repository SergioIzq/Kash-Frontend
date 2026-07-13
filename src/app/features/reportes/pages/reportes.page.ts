import { Component, inject, signal, computed, effect, viewChild, ElementRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';

import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type PDFDocumentLoadingTask } from 'pdfjs-dist';

import { ReporteService } from '@/core/services/api/reporte.service';
import { BasePageTemplateComponent } from '@sergioizq/ngx-crud-ui';

// El worker se sirve como asset propio del bundle (mismo origen), sin CDN.
GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

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
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
        }
        /* Contenedor donde PDF.js apila las páginas renderizadas a canvas */
        .pdf-scroll {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 8px;
        }
        .pdf-scroll canvas {
            max-width: 100%;
            height: auto;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
            border-radius: 4px;
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
        <ngxc-base-page-template>
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
                        @if (pdfBlob()) {
                            <div #pdfContainer class="preview-frame pdf-scroll"></div>
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
        </ngxc-base-page-template>
    `
})
export class ReportesPage implements OnDestroy {
    private readonly reporteService = inject(ReporteService);
    private readonly messageService = inject(MessageService);

    private readonly pdfContainer = viewChild<ElementRef<HTMLDivElement>>('pdfContainer');
    private readonly pdfDoc = signal<PDFDocumentProxy | null>(null);
    private pdfLoadingTask: PDFDocumentLoadingTask | null = null;

    private resizeObserver: ResizeObserver | null = null;
    private observedEl: HTMLElement | null = null;
    private lastRenderWidth = 0;
    private renderSeq = 0;

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

    readonly fechaInicio = computed(() => this.rango()?.[0] ?? null);
    readonly fechaFin = computed(() => this.rango()?.[1] ?? null);

    readonly rangoValido = computed(() => {
        const desde = this.fechaInicio();
        const hasta = this.fechaFin();
        return !!desde && !!hasta && desde.getTime() <= hasta.getTime();
    });

    constructor() {
        this.aplicarPreset('anio');

        // Renderiza (o re-renderiza) el PDF cuando el contenedor aparece en el DOM
        // o cuando cambia el documento cargado.
        effect(() => {
            const ref = this.pdfContainer();
            const doc = this.pdfDoc();
            if (!ref || !doc) return;
            const el = ref.nativeElement;
            this.observeResize(el);
            void this.renderPdf(el, doc);
        });
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        void this.pdfLoadingTask?.destroy();
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

            this.pdfBlob.set(blob);
            await this.loadPdf(blob);
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

    /** Carga el PDF con PDF.js; el effect se encarga de renderizarlo cuando toque. */
    private async loadPdf(blob: Blob): Promise<void> {
        const data = await blob.arrayBuffer();
        void this.pdfLoadingTask?.destroy();
        this.lastRenderWidth = 0;
        const task = getDocument({ data });
        this.pdfLoadingTask = task;
        const doc = await task.promise;
        this.pdfDoc.set(doc);
    }

    /**
     * Renderiza todas las páginas del PDF a <canvas> ajustadas al ancho del
     * contenedor (fit-to-width). Funciona en todos los navegadores, incluidos
     * iOS (sin scroll horizontal) y Android antiguo (que no soporta iframe PDF).
     */
    private async renderPdf(container: HTMLDivElement, doc: PDFDocumentProxy): Promise<void> {
        const cssWidth = container.clientWidth - 16; // descontar el padding lateral
        if (cssWidth <= 0) return;

        const seq = ++this.renderSeq;
        this.lastRenderWidth = cssWidth;
        // Limitar el ratio para no disparar el uso de memoria en móviles de gama alta.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const canvases: HTMLCanvasElement[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
            const page = await doc.getPage(n);
            if (seq !== this.renderSeq) return; // llegó un render más nuevo

            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });

            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${cssWidth}px`;

            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            await page.render({ canvas, canvasContext: ctx, viewport }).promise;
            if (seq !== this.renderSeq) return;
            canvases.push(canvas);
        }

        if (seq === this.renderSeq) {
            container.replaceChildren(...canvases);
        }
    }

    /** Re-renderiza (fit-to-width) cuando cambia el ancho del contenedor u orientación. */
    private observeResize(el: HTMLElement): void {
        if (this.observedEl === el) return;

        this.resizeObserver?.disconnect();
        this.observedEl = el;

        let raf = 0;
        this.resizeObserver = new ResizeObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const width = el.clientWidth - 16;
                const doc = this.pdfDoc();
                if (doc && width > 0 && width !== this.lastRenderWidth) {
                    void this.renderPdf(el as HTMLDivElement, doc);
                }
            });
        });
        this.resizeObserver.observe(el);
    }
}
