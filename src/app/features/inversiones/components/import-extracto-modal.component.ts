import { Component, inject, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';

import { BrokerFormat, ImportarExtractoResult } from '@/core/models/inversion.model';
import { InversionesStore } from '../stores/inversiones.store';

// ── Broker format catalogue ─────────────────────────────────────────────────

interface BrokerFormatConfig {
    value: BrokerFormat;
    label: string;
    icon: string;
    color: string;
    description: string;
    columns: string;
    example: string;
    guide: string;
    fileType: 'csv' | 'pdf';
}

const BROKER_FORMATS: BrokerFormatConfig[] = [
    {
        value: 'generic',
        label: 'CSV Genérico',
        icon: 'pi pi-file-excel',
        color: '#10B981',
        description: 'Formato universal para cualquier bróker.',
        columns: 'nombre, ticker, tipo, cantidad, precio_compra, moneda, fecha_compra [, descripcion] [, plataforma]',
        example: 'Apple Inc.,AAPL,accion,10,182.50,USD,2024-03-15',
        guide: 'Crea un CSV con una fila de cabecera y una fila por posición. Separadores válidos: coma (,) o punto y coma (;). Fechas en formato YYYY-MM-DD. El campo "tipo" debe ser uno de: etf, accion, cripto, bono, fondo, mercado_privado, otro.',
        fileType: 'csv'
    },
    {
        value: 'trade_republic',
        label: 'Trade Republic CSV',
        icon: 'pi pi-briefcase',
        color: '#3B82F6',
        description: 'Historial de operaciones de Trade Republic.',
        columns: 'Datum, Typ, ISIN, Name, Stücke, Kurs, Währung',
        example: '2024-03-15,Kauf,US0378331005,Apple Inc.,10,182.50,USD',
        guide: 'En la app TR: Perfil → Documentos de cuenta → Historial de operaciones → Exportar CSV. Solo se importan operaciones de tipo "Kauf" (compra).',
        fileType: 'csv'
    },
    {
        value: 'trade_republic_pdf',
        label: 'Trade Republic PDF',
        icon: 'pi pi-file-pdf',
        color: '#EF4444',
        description: 'Factura/Abrechnung de compra de Trade Republic en PDF.',
        columns: '(extraído automáticamente del PDF)',
        example: 'Archivo .pdf descargado desde "Documentos" en la app de TR',
        guide: 'En la app TR: toca cualquier posición → Documentos → Abrechnung (factura de compra) → Descarga el PDF. Puedes subir varios PDF a la vez arrastrándolos. Solo se importan facturas de tipo "Kauf" (compra).',
        fileType: 'pdf'
    },
    {
        value: 'degiro',
        label: 'DEGIRO',
        icon: 'pi pi-chart-bar',
        color: '#EF4444',
        description: 'Historial de transacciones de DEGIRO.',
        columns: 'Fecha, Hora, Producto, ISIN, Lugar, Número, Precio, Divisa local, Valor local...',
        example: '15-03-2024,10:00,Apple Inc.,US0378331005,XETRA,10,182.50,USD,1825.00,...',
        guide: 'En DEGIRO: Actividad → Transacciones → selecciona rango de fechas → Exportar → CSV. Solo se importan compras (cantidad positiva).',
        fileType: 'csv'
    },
    {
        value: 'interactive_brokers',
        label: 'Interactive Brokers',
        icon: 'pi pi-building',
        color: '#8B5CF6',
        description: 'Flex Query de actividad de trades (IBKR).',
        columns: 'TradeDate, Symbol, Description, Quantity, TradePrice, CurrencyPrimary, AssetCategory',
        example: '20240315,AAPL,APPLE INC,10,182.500,USD,STK',
        guide: 'Portal IBKR: Informes → Extractos → Flex Queries. Crea un query con sección "Trades" incluyendo los campos indicados. Descarga en CSV. Solo se importan compras (Quantity > 0).',
        fileType: 'csv'
    },
    {
        value: 'binance',
        label: 'Binance',
        icon: 'pi pi-bitcoin',
        color: '#F59E0B',
        description: 'Historial de operaciones spot de Binance.',
        columns: 'Date(UTC), Pair, Side, Price, Executed, Amount, Fee',
        example: '2024-03-15 10:00:00,BTCUSDT,BUY,65000.00,0.001 BTC,65.00 USDT,0.001 BNB',
        guide: 'En Binance: Cartera → Spot → Historial de operaciones → Exportar → CSV. Solo se importan operaciones "BUY".',
        fileType: 'csv'
    }
];

type ImportStep = 'select' | 'importing' | 'result';

@Component({
    selector: 'app-import-extracto-modal',
    standalone: true,
    imports: [
        CommonModule,
        DrawerModule,
        ButtonModule,
        TagModule,
        TableModule,
        ProgressSpinnerModule,
        TooltipModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
        .broker-card {
            border: 2px solid transparent;
            border-radius: 10px;
            padding: .85rem .75rem;
            cursor: pointer;
            transition: border-color .15s, background .15s;
            background: var(--surface-ground);
        }
        .broker-card:hover { background: var(--surface-hover); }
        .broker-card.selected {
            border-color: var(--primary-color);
            background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .drop-zone {
            border: 2px dashed var(--surface-400);
            border-radius: 10px;
            padding: 2.5rem 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: border-color .15s, background .15s;
        }
        .drop-zone:hover, .drop-zone.dragover {
            border-color: var(--primary-color);
            background: color-mix(in srgb, var(--primary-color) 6%, transparent);
        }
        .drop-zone.has-file {
            border-color: #22c55e;
            background: color-mix(in srgb, #22c55e 6%, transparent);
            cursor: default;
        }
    `],
    template: `
        <p-drawer
            [visible]="visible()"
            (visibleChange)="handleHide($event)"
            position="right"
            styleClass="!w-full md:!w-[700px]"
            [blockScroll]="true"
        >
            <ng-template #header>
                <div class="flex align-items-center gap-3">
                    <i class="pi pi-upload text-primary text-xl"></i>
                    <span class="font-bold text-xl">Importar extracto de bróker</span>
                </div>
            </ng-template>

            <!-- ── Step 1: select format + file ─────────────────────── -->
            @if (step() === 'select') {
                <div class="flex flex-col gap-5 px-1">

                    <!-- Broker selector -->
                    <div>
                        <p class="font-semibold mb-3 m-0">
                            1. Selecciona el formato de tu bróker
                        </p>
                        <div class="grid grid-cols-3 gap-2">
                            @for (fmt of brokerFormats; track fmt.value) {
                                <div
                                    class="broker-card"
                                    [class.selected]="selectedFormat() === fmt.value"
                                    (click)="selectFormat(fmt.value)"
                                >
                                    <div class="flex align-items-center gap-2 mb-1">
                                        <i [class]="fmt.icon" [style.color]="fmt.color" class="text-base"></i>
                                        <span class="font-semibold text-sm">{{ fmt.label }}</span>
                                    </div>
                                    <p class="text-xs text-500 m-0 leading-snug">{{ fmt.description }}</p>
                                </div>
                            }
                        </div>
                    </div>

                    <!-- Format guide -->
                    @if (selectedFormatConfig()) {
                        <div class="surface-50 border-round-lg p-3 border surface-border">
                            <p class="font-semibold text-sm m-0 mb-2">
                                <i class="pi pi-info-circle mr-2 text-primary"></i>
                                Formato esperado: <strong>{{ selectedFormatConfig()!.label }}</strong>
                            </p>
                            <div class="flex flex-col gap-2 text-xs text-700">
                                <div>
                                    <span class="text-500">Columnas: </span>
                                    <code class="surface-200 border-round px-1 py-0">{{ selectedFormatConfig()!.columns }}</code>
                                </div>
                                <div>
                                    <span class="text-500">Ejemplo: </span>
                                    <code class="surface-200 border-round px-1 py-0">{{ selectedFormatConfig()!.example }}</code>
                                </div>
                                <div class="surface-100 border-round p-2 mt-1 text-600 leading-relaxed">
                                    <i class="pi pi-question-circle mr-1 text-blue-400"></i>
                                    {{ selectedFormatConfig()!.guide }}
                                </div>
                            </div>
                        </div>
                    }

                    <!-- Drop zone -->
                    <div>
                        <p class="font-semibold mb-3 m-0">2. Sube el archivo CSV</p>

                        <div
                            class="drop-zone"
                            [class.has-file]="selectedFile() !== null"
                            [class.dragover]="isDragOver()"
                            (click)="selectedFile() === null && fileInput.click()"
                            (dragover)="onDragOver($event)"
                            (dragleave)="isDragOver.set(false)"
                            (drop)="onDrop($event)"
                        >
                            @if (selectedFile()) {
                                <i [class]="isPdf() ? 'pi pi-file-pdf text-red-500' : 'pi pi-file-excel text-green-500'" class="text-4xl block mb-2"></i>
                                <p class="font-semibold m-0" [class.text-green-600]="!isPdf()" [class.text-red-600]="isPdf()">{{ selectedFile()!.name }}</p>
                                <p class="text-500 text-sm m-0 mt-1">{{ fileSize() }} · {{ estimatedRows() }}</p>
                            } @else {
                                <i [class]="isPdf() ? 'pi pi-file-pdf' : 'pi pi-cloud-upload'" class="text-4xl text-400 block mb-3"></i>
                                <p class="font-semibold text-900 m-0">Arrastra tu {{ isPdf() ? 'PDF' : 'CSV' }} aquí</p>
                                <p class="text-500 text-sm mt-1 mb-0">o haz clic para seleccionar</p>
                                <p class="text-400 text-xs mt-2 mb-0">Solo archivos {{ isPdf() ? '.pdf' : '.csv' }} · Máximo 10 MB</p>
                            }
                        </div>

                        @if (selectedFile()) {
                            <div class="flex justify-end mt-1">
                                <p-button
                                    label="Cambiar archivo"
                                    severity="secondary"
                                    [text]="true"
                                    size="small"
                                    icon="pi pi-refresh"
                                    (onClick)="clearFile()"
                                />
                            </div>
                        }

                        <input #fileInput type="file" [attr.accept]="fileAccept()" class="hidden" (change)="onFileChange($event)" />
                    </div>

                    @if (fileError()) {
                        <div class="flex align-items-center gap-2 text-red-500 text-sm">
                            <i class="pi pi-exclamation-circle"></i>
                            {{ fileError() }}
                        </div>
                    }

                </div>
            }

            <!-- ── Step 2: importing ─────────────────────────────────── -->
            @if (step() === 'importing') {
                <div class="flex flex-col align-items-center justify-center gap-4 py-16">
                    <p-progressspinner strokeWidth="4" styleClass="w-16 h-16" />
                    <p class="font-semibold text-xl m-0">Procesando el extracto...</p>
                    <p class="text-500 m-0 text-sm text-center max-w-sm">
                        El servidor está analizando tu archivo y creando las posiciones.<br>
                        Esto puede tardar unos segundos.
                    </p>
                </div>
            }

            <!-- ── Step 3: result ────────────────────────────────────── -->
            @if (step() === 'result' && importResult()) {
                <div class="flex flex-col gap-5 px-1">

                    <!-- KPI cards -->
                    <div class="grid grid-cols-3 gap-3">
                        <div class="surface-card border-round-lg p-4 text-center shadow-1">
                            <i class="pi pi-check-circle text-green-500 text-3xl mb-2 block"></i>
                            <div class="text-3xl font-bold text-green-500 mb-1">{{ importResult()!.importadas }}</div>
                            <div class="text-500 text-sm">importadas</div>
                        </div>
                        <div class="surface-card border-round-lg p-4 text-center shadow-1">
                            <i class="pi pi-skip-forward text-orange-400 text-3xl mb-2 block"></i>
                            <div class="text-3xl font-bold text-orange-400 mb-1">{{ importResult()!.duplicadas }}</div>
                            <div class="text-500 text-sm">duplicadas omitidas</div>
                        </div>
                        <div class="surface-card border-round-lg p-4 text-center shadow-1">
                            <i class="pi pi-times-circle text-red-400 text-3xl mb-2 block"></i>
                            <div class="text-3xl font-bold text-red-400 mb-1">{{ importResult()!.errores.length }}</div>
                            <div class="text-500 text-sm">errores</div>
                        </div>
                    </div>

                    @if (importResult()!.importadas === 0 && importResult()!.errores.length === 0 && importResult()!.duplicadas === 0) {
                        <div class="text-center text-500 py-6">
                            <i class="pi pi-inbox text-4xl mb-3 block"></i>
                            <p class="text-lg m-0">No se encontraron filas en el archivo.</p>
                        </div>
                    }

                    @if (importResult()!.importadas === 0 && importResult()!.duplicadas > 0 && importResult()!.errores.length === 0) {
                        <div class="surface-50 border-round p-3 flex gap-3 align-items-center">
                            <i class="pi pi-info-circle text-orange-400 text-xl"></i>
                            <span class="text-700 text-sm">Todas las posiciones del archivo ya existían — no se importó ninguna nueva.</span>
                        </div>
                    }

                    <!-- Error details table -->
                    @if (importResult()!.errores.length > 0) {
                        <div>
                            <p class="font-semibold mb-3 m-0">
                                <i class="pi pi-exclamation-triangle text-orange-400 mr-2"></i>
                                Filas con errores
                            </p>
                            <p-table
                                [value]="importResult()!.errores"
                                [scrollable]="true"
                                scrollHeight="240px"
                                styleClass="p-datatable-sm p-datatable-gridlines"
                            >
                                <ng-template #header>
                                    <tr>
                                        <th style="width: 5rem">Línea</th>
                                        <th>Contenido</th>
                                        <th style="min-width: 14rem">Motivo</th>
                                    </tr>
                                </ng-template>
                                <ng-template #body let-err>
                                    <tr>
                                        <td class="text-center font-mono text-sm">{{ err.linea }}</td>
                                        <td class="font-mono text-xs text-500">
                                            {{ err.contenido.length > 60 ? (err.contenido | slice:0:60) + '…' : err.contenido }}
                                        </td>
                                        <td class="text-red-500 text-sm">{{ err.razon }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                    }
                </div>
            }

            <ng-template #footer>
                @if (step() === 'select') {
                    <div class="flex gap-2 justify-end">
                        <p-button
                            label="Cancelar"
                            severity="secondary"
                            [outlined]="true"
                            (onClick)="close()"
                        />
                        <p-button
                            label="Importar"
                            icon="pi pi-upload"
                            [disabled]="!selectedFile()"
                            (onClick)="startImport()"
                        />
                    </div>
                }
                @if (step() === 'result') {
                    <div class="flex gap-2 justify-end">
                        <p-button
                            label="Importar otro archivo"
                            icon="pi pi-refresh"
                            severity="secondary"
                            [outlined]="true"
                            (onClick)="reset()"
                        />
                        <p-button
                            label="Cerrar"
                            icon="pi pi-check"
                            (onClick)="close()"
                        />
                    </div>
                }
            </ng-template>
        </p-drawer>
    `
})
export class ImportExtractoModalComponent {
    private readonly store = inject(InversionesStore);

    // ── Inputs / Outputs ──────────────────────────────────────────────────────
    visible = input.required<boolean>();
    visibleChange = output<boolean>();
    /** Emitted when at least one inversion was successfully imported */
    imported = output<number>();

    // ── State ─────────────────────────────────────────────────────────────────
    step = signal<ImportStep>('select');
    selectedFormat = signal<BrokerFormat>('generic');
    selectedFile = signal<File | null>(null);
    isDragOver = signal(false);
    fileError = signal<string | null>(null);
    importResult = signal<ImportarExtractoResult | null>(null);

    readonly brokerFormats = BROKER_FORMATS;

    // ── Computed ──────────────────────────────────────────────────────────────
    selectedFormatConfig = computed(() =>
        BROKER_FORMATS.find((f) => f.value === this.selectedFormat()) ?? null
    );

    fileSize = computed(() => {
        const f = this.selectedFile();
        if (!f) return '';
        const kb = f.size / 1024;
        return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
    });

    estimatedRows = computed(() => {
        const f = this.selectedFile();
        if (!f) return '';
        if (this.isPdf()) return 'Factura PDF';
        const est = Math.max(0, Math.round(f.size / 80) - 1);
        return est > 0 ? `~${est} filas estimadas` : 'Archivo pequeño';
    });

    isPdf = computed(() => this.selectedFormatConfig()?.fileType === 'pdf');

    fileAccept = computed(() => this.isPdf() ? '.pdf,application/pdf' : '.csv,text/csv');

    // ── File handling ─────────────────────────────────────────────────────────
    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) this.setFile(file);
        input.value = '';
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
        const file = event.dataTransfer?.files[0];
        if (file) this.setFile(file);
    }

    private setFile(file: File): void {
        const isPdfFormat = this.isPdf();
        const maxSize = isPdfFormat ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

        if (isPdfFormat) {
            const validPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
            if (!validPdf) { this.fileError.set('Solo se aceptan archivos .pdf para este formato'); return; }
        } else {
            const validTypes = ['text/csv', 'application/csv', 'application/vnd.ms-excel'];
            const validExt = file.name.toLowerCase().endsWith('.csv');
            if (!validExt && !validTypes.includes(file.type)) {
                this.fileError.set('Solo se aceptan archivos .csv');
                return;
            }
        }

        if (file.size > maxSize) {
            this.fileError.set(`El archivo no puede superar los ${isPdfFormat ? '10' : '5'} MB`);
            return;
        }
        this.fileError.set(null);
        this.selectedFile.set(file);
    }

    clearFile(): void {
        this.selectedFile.set(null);
        this.fileError.set(null);
    }

    selectFormat(value: BrokerFormat): void {
        const newType = BROKER_FORMATS.find((f) => f.value === value)?.fileType;
        const curType = this.selectedFormatConfig()?.fileType;
        if (newType !== curType) {
            this.selectedFile.set(null);
            this.fileError.set(null);
        }
        this.selectedFormat.set(value);
    }

    // ── Import ────────────────────────────────────────────────────────────────
    async startImport(): Promise<void> {
        const file = this.selectedFile();
        if (!file) return;

        this.step.set('importing');
        try {
            const result = await this.store.importarExtracto(this.selectedFormat(), file);
            this.importResult.set(result);
            this.step.set('result');
            if (result.importadas > 0) {
                this.imported.emit(result.importadas);
            }
        } catch {
            // store already set the error; go back to select so user can retry
            this.step.set('select');
        }
    }

    reset(): void {
        this.step.set('select');
        this.selectedFile.set(null);
        this.fileError.set(null);
        this.importResult.set(null);
    }

    close(): void {
        this.visibleChange.emit(false);
    }

    handleHide(visible: boolean): void {
        // Block close while import is in progress
        if (!visible && this.step() !== 'importing') {
            this.reset();
            this.close();
        }
    }
}
