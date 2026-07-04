import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Input de importe basado en un `<input>` HTML nativo (no PrimeNG), para tener
 * control total sobre la entrada de decimales sin que la librería interfiera en
 * el cursor.
 *
 * Comportamiento:
 * - Mientras se edita, muestra el número en crudo con coma decimal y sin miles
 *   (p. ej. `1234,56`). Al perder el foco, formatea a euros español (`1.234,56 €`).
 * - Acepta como separador decimal tanto la coma como el punto, por lo que el
 *   teclado del móvil (que suele dar solo el punto) y el del PC funcionan igual.
 * - `inputmode="decimal"` para mostrar el teclado numérico adecuado en móvil.
 * - Implementa `ControlValueAccessor`, así que se usa con `[(ngModel)]` igual que
 *   antes y expone/recibe un `number | null`.
 */
@Component({
    selector: 'app-money-input',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <input
            type="text"
            inputmode="decimal"
            autocomplete="off"
            [attr.id]="inputId()"
            [value]="displayValue()"
            [placeholder]="placeholder()"
            [disabled]="disabled()"
            [class]="'p-inputtext w-full ' + inputClass()"
            (focus)="onFocus($event)"
            (input)="onInput($event)"
            (blur)="onBlur()"
            (beforeinput)="onBeforeInput($event)"
        />
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MoneyInputComponent),
            multi: true,
        },
    ],
})
export class MoneyInputComponent implements ControlValueAccessor {
    readonly inputClass = input('');
    readonly placeholder = input('0,00 €');
    readonly inputId = input<string | null>(null);

    protected readonly displayValue = signal('');
    protected readonly disabled = signal(false);

    private value: number | null = null;
    private focused = false;

    private onChange: (value: number | null) => void = () => {};
    private onTouched: () => void = () => {};

    // --- ControlValueAccessor ---
    writeValue(value: number | null): void {
        this.value = value ?? null;
        // No pisamos lo que el usuario está escribiendo si el campo tiene el foco.
        if (!this.focused) {
            this.displayValue.set(this.format(this.value));
        }
    }

    registerOnChange(fn: (value: number | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }

    // --- Eventos del input ---
    protected onFocus(event: FocusEvent): void {
        this.focused = true;
        this.displayValue.set(this.toEditString(this.value));
        // Seleccionamos todo para poder sobrescribir cómodamente.
        (event.target as HTMLInputElement).select();
    }

    protected onInput(event: Event): void {
        // No reescribimos el valor del input durante la escritura: así el cursor
        // se queda donde el usuario lo tiene (sin saltos).
        this.value = this.parse((event.target as HTMLInputElement).value);
        this.onChange(this.value);
    }

    protected onBlur(): void {
        this.focused = false;
        if (this.value != null) {
            // Redondeamos a 2 decimales (céntimos) al confirmar.
            this.value = Math.round(this.value * 100) / 100;
            this.onChange(this.value);
        }
        this.onTouched();
        this.displayValue.set(this.format(this.value));
    }

    protected onBeforeInput(event: InputEvent): void {
        // Bloqueamos cualquier carácter que no sea dígito, coma o punto.
        if (event.data && /[^\d.,]/.test(event.data)) {
            event.preventDefault();
        }
    }

    // --- Conversión ---
    private parse(raw: string): number | null {
        if (!raw) {
            return null;
        }
        let s = raw.replace(/[^\d.,]/g, '');
        if (!s) {
            return null;
        }
        // Unificamos a coma y tratamos el último separador como decimal; el resto
        // (posibles separadores de miles pegados) se eliminan.
        s = s.replace(/\./g, ',');
        const parts = s.split(',');
        if (parts.length > 1) {
            const decimals = parts.pop();
            s = parts.join('') + '.' + decimals;
        }
        const parsed = Number(s);
        return Number.isNaN(parsed) ? null : parsed;
    }

    private format(value: number | null): string {
        if (value == null || Number.isNaN(value)) {
            return '';
        }
        return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
    }

    private toEditString(value: number | null): string {
        if (value == null || Number.isNaN(value)) {
            return '';
        }
        return value.toLocaleString('es-ES', { useGrouping: false, maximumFractionDigits: 2 });
    }
}
