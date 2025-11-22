import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div *ngIf="loading" class="flex justify-center items-center py-8">
            <i class="pi pi-spin pi-spinner" [style.font-size]="size"></i>
        </div>
    `
})
export class LoaderComponent {
    @Input() loading = false;
    @Input() size = '2rem';
}
