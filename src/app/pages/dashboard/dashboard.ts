import { Component } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    imports: [],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h5>Dashboard</h5>
                    <p>Bienvenido a AhorroLand. Este es tu panel de control.</p>
                </div>
            </div>
            
            <!-- Aquí puedes agregar tus widgets personalizados -->
        </div>
    `
})
export class Dashboard {}
