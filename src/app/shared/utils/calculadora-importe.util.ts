export type OperadorCalculadora = '+' | '-' | '×' | '÷';

/**
 * Motor de cálculo para la calculadora del campo Importe (`calculadora-importe.component.ts`).
 *
 * Evaluación secuencial sin precedencia de operadores (estilo calculadora de bolsillo):
 * cada operador pulsado resuelve inmediatamente la operación pendiente contra el valor
 * anterior, en vez de respetar la precedencia matemática de `×`/`÷` sobre `+`/`-`
 * (decisión explícita, ver `design.md`).
 *
 * El separador decimal es la coma, igual que `money-input.component.ts`. El redondeo a
 * céntimos (2 decimales) solo se aplica al exponer el resultado final vía
 * `obtenerResultado()`; durante el cálculo se conserva la precisión nativa de JS para no
 * acumular error en operaciones encadenadas.
 */
export class CalculadoraImporte {
    private display = '0';
    private acumulado: number | null = null;
    private operadorPendiente: OperadorCalculadora | null = null;
    /** Si es `true`, la siguiente pulsación de dígito empieza un número nuevo en vez de continuar el actual. */
    private sobrescribir = true;
    private error = false;

    constructor() {
        this.limpiar();
    }

    get pantalla(): string {
        return this.display;
    }

    get hayError(): boolean {
        return this.error;
    }

    /** Operador a la espera de un segundo operando, para que la UI pueda mostrarlo y confirmar visualmente que la pulsación se registró (sin esto no hay forma de saber si "×" se registró antes de seguir tecleando). */
    get operadorActual(): OperadorCalculadora | null {
        return this.operadorPendiente;
    }

    introducirDigito(digito: string): void {
        if (this.error) return;

        if (this.sobrescribir) {
            this.display = digito === ',' ? '0,' : digito;
            this.sobrescribir = false;
            return;
        }
        if (digito === ',' && this.display.includes(',')) return;

        this.display = this.display === '0' && digito !== ',' ? digito : this.display + digito;
    }

    introducirOperador(operador: OperadorCalculadora): void {
        if (this.error) return;

        // Si no se ha tecleado un número nuevo desde el último operador, solo se cambia el
        // operador pendiente (p. ej. pulsar "+" y luego "-" sin escribir nada entre medias).
        if (!this.sobrescribir) {
            const valor = this.valorActual();
            if (this.acumulado !== null && this.operadorPendiente !== null) {
                const resultado = this.aplicarOperacion(this.acumulado, valor, this.operadorPendiente);
                if (resultado === null) {
                    this.marcarError();
                    return;
                }
                this.acumulado = resultado;
            } else {
                this.acumulado = valor;
            }
            this.display = this.formatear(this.acumulado);
        }

        this.operadorPendiente = operador;
        this.sobrescribir = true;
    }

    calcular(): void {
        if (this.error) return;

        const valor = this.valorActual();
        if (this.operadorPendiente !== null) {
            const resultado = this.aplicarOperacion(this.acumulado ?? 0, valor, this.operadorPendiente);
            if (resultado === null) {
                this.marcarError();
                return;
            }
            this.acumulado = resultado;
        } else {
            this.acumulado = valor;
        }

        this.operadorPendiente = null;
        this.display = this.formatear(this.acumulado);
        this.sobrescribir = true;
    }

    limpiar(): void {
        this.display = '0';
        this.acumulado = null;
        this.operadorPendiente = null;
        this.sobrescribir = true;
        this.error = false;
    }

    /** Valor mostrado en pantalla, redondeado a céntimos igual que `money-input.component.ts`, listo para aplicarse al campo Importe. */
    obtenerResultado(): number {
        return Math.round(this.valorActual() * 100) / 100;
    }

    /** Valor numérico representado por la pantalla actual, sin volver a parsear el string cuando ya es el propio acumulado (evita perder precisión por el truncado de `formatear`). */
    private valorActual(): number {
        return this.sobrescribir && this.acumulado !== null ? this.acumulado : this.parsearDisplay();
    }

    private parsearDisplay(): number {
        const valor = Number(this.display.replace(',', '.'));
        return Number.isNaN(valor) ? 0 : valor;
    }

    private aplicarOperacion(a: number, b: number, operador: OperadorCalculadora): number | null {
        switch (operador) {
            case '+':
                return a + b;
            case '-':
                return a - b;
            case '×':
                return a * b;
            case '÷':
                return b === 0 ? null : a / b;
        }
    }

    private marcarError(): void {
        this.error = true;
        this.display = 'Error';
    }

    private formatear(valor: number): string {
        if (!Number.isFinite(valor)) return 'Error';
        return valor.toLocaleString('es-ES', { useGrouping: false, maximumFractionDigits: 8 });
    }
}
