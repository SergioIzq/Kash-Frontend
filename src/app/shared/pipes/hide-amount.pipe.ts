import { DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { LayoutService } from '../../layout/service/layout.service';

@Pipe({
    name: 'hideAmount',
    standalone: true,
    pure: false
})
export class HideAmountPipe implements PipeTransform {
    private readonly layoutService = inject(LayoutService);
    private readonly decimalPipe = new DecimalPipe('es-ES');

    transform(value: number | null | undefined, tipo: 'currency' | 'percent', symbol?: string, digitsInfo = '1.2-2'): string {
        const resolvedSymbol = tipo === 'percent' ? '%' : (symbol ?? '€');

        if (this.layoutService.isAmountsHidden()) {
            return `**** ${resolvedSymbol}`;
        }

        const formatted = this.decimalPipe.transform(value, digitsInfo) ?? '';
        return `${formatted} ${resolvedSymbol}`;
    }
}
