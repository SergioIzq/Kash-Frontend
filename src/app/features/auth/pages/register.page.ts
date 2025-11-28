import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthWrapperComponent } from '../components/auth-wrapper.component';

@Component({
    selector: 'app-register-page',
    standalone: true,
    imports: [
        AuthWrapperComponent,
        ButtonModule, 
        CheckboxModule, 
        InputTextModule, 
        PasswordModule, 
        FormsModule, 
        RouterModule, 
        DividerModule
    ],
    template: `
        <app-auth-wrapper 
            title="Crear Cuenta" 
            subtitle="Únete a AhorroLand hoy mismo">
            
            @if (showSuccessView()) {
                <div class="w-full md:w-120 flex flex-col items-center text-center animate-fadein">
                    <div class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                        <i class="pi pi-envelope text-green-600 dark:text-green-300 text-4xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold mb-4 text-surface-900 dark:text-surface-0">¡Revisa tu correo!</h2>
                    <p class="text-muted-color mb-6">
                        Hemos enviado un enlace de confirmación a <strong>{{ email }}</strong>. 
                        Activa tu cuenta para poder iniciar sesión.
                    </p>
                    <p-button label="Ir al Login" routerLink="/auth/login" [outlined]="true" styleClass="w-full"></p-button>
                </div>
            } 
            
            @else {
                <div class="w-full md:w-120">
                    
                    <div class="flex flex-col gap-5"> <div>
                            <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Email</label>
                            <input 
                                pInputText 
                                id="email" 
                                type="text" 
                                placeholder="tu@email.com" 
                                class="w-full" 
                                [(ngModel)]="email" 
                                [disabled]="authStore.loading()" />
                        </div>

                        <div>
                            <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                            <p-password
                                id="password"
                                [(ngModel)]="password"
                                placeholder="Mínimo 8 caracteres"
                                [toggleMask]="true"
                                styleClass="w-full"
                                [fluid]="true"
                                [feedback]="true"
                                promptLabel="Ingresa una contraseña"
                                weakLabel="Débil"
                                mediumLabel="Regular"
                                strongLabel="Fuerte"
                                [disabled]="authStore.loading()"></p-password>
                        </div>

                        <div class="flex items-center mb-2">
                            <p-checkbox 
                                [(ngModel)]="termsAccepted" 
                                id="terms" 
                                binary="true" 
                                styleClass="mr-2" 
                                [disabled]="authStore.loading()"></p-checkbox>
                            <label for="terms" class="text-surface-900 dark:text-surface-0"> 
                                Acepto los <a class="text-primary font-bold hover:underline cursor-pointer">términos y condiciones</a> 
                            </label>
                        </div>

                        <p-button 
                            label="Registrarse" 
                            styleClass="w-full" 
                            [loading]="authStore.loading()" 
                            [disabled]="!isValidForm()" 
                            (onClick)="onRegister()"></p-button>
                    </div>

                    <div class="mt-8 text-center"> <p-divider align="center" styleClass="my-4">
                            <span class="text-muted-color text-sm">¿Ya tienes cuenta?</span>
                        </p-divider>
                        <a routerLink="/auth/login" class="font-medium text-primary hover:text-primary-600 cursor-pointer transition-colors no-underline">
                            Iniciar sesión aquí
                        </a>
                    </div>
                </div>
            }

        </app-auth-wrapper>
    `
})
export class RegisterPage {
    authStore = inject(AuthStore);
    private router = inject(Router);

    email: string = '';
    password: string = '';
    termsAccepted: boolean = false;
    
    showSuccessView = signal(false);
    private isSubmitting = false;

    constructor() {
        effect(() => {
            if (this.authStore.user() && !this.authStore.loading()) {
                this.router.navigate(['/']);
            }
        });

        effect(() => {
            const isLoading = this.authStore.loading();
            const error = this.authStore.error();

            if (this.isSubmitting && !isLoading) {
                if (!error) {
                    this.showSuccessView.set(true);
                } 
                this.isSubmitting = false;
            }
        });
    }

    isValidForm(): boolean {
        return this.email.length > 0 && this.password.length > 0 && this.termsAccepted;
    }

    onRegister() {
        if (!this.isValidForm()) return;
        this.isSubmitting = true;
        this.authStore.register({ 
            correo: this.email, 
            contrasena: this.password 
        });
    }
}