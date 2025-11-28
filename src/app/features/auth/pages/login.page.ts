import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthWrapperComponent } from '../components/auth-wrapper.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-login-page',
    standalone: true,
    imports: [
        AuthWrapperComponent, // Importamos el wrapper
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PasswordModule,
        FormsModule,
        RouterModule,
        MessageModule,
        ToastModule
    ],
    template: `
        <app-auth-wrapper title="Bienvenido a AhorroLand" subtitle="Inicia sesión para continuar">
            @if (authStore.error()) {
                <p-message severity="error" [text]="authStore.error()!" styleClass="mb-4 w-full"></p-message>
            }

            <div>
                <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                <input pInputText id="email" type="text" placeholder="tu@email.com" class="w-full md:w-120 mb-8" [(ngModel)]="email" [disabled]="authStore.loading()" (keyup.enter)="onLogin()" />

                <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                <p-password id="password" [(ngModel)]="password" placeholder="Contraseña" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false" [disabled]="authStore.loading()" (keyup.enter)="onLogin()"></p-password>

                <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                    <div class="flex items-center">
                        <p-checkbox [(ngModel)]="rememberMe" id="rememberme" binary="true" class="mr-2" [disabled]="authStore.loading()"></p-checkbox>
                        <label for="rememberme">Recordarme</label>
                    </div>
                    <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">¿Olvidaste tu contraseña?</span>
                </div>

                <p-button label="Iniciar Sesión" styleClass="w-full" [loading]="authStore.loading()" [disabled]="!email || !password" (onClick)="onLogin()"></p-button>

                <div class="mt-6 text-center">
                    <div class="mb-4 text-surface-600 dark:text-surface-400 font-medium">
                        ¿No tienes cuenta?
                        <a routerLink="/auth/register" class="text-primary cursor-pointer hover:underline no-underline">Regístrate aquí</a>
                    </div>

                    <div class="text-sm text-surface-500">
                        ¿Problemas con la verificación?
                        <span class="text-primary font-medium cursor-pointer hover:underline" (click)="onResendConfirmation()"> Reenviar correo de confirmación </span>
                    </div>
                </div>
            </div>
        </app-auth-wrapper>
    `
})
export class LoginPage {
    authStore = inject(AuthStore);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    email: string = '';
    password: string = '';
    rememberMe: boolean = false;
    private returnUrl: string = '/';

    constructor() {
        this.route.queryParams.subscribe((params) => (this.returnUrl = params['returnUrl'] || '/'));

        effect(() => {
            if (this.authStore.isLoggedIn() && !this.authStore.loading()) {
                this.router.navigate([this.returnUrl]);
            }
        });
    }

    onLogin() {
        if (!this.email || !this.password) return;
        this.authStore.login({ correo: this.email, contrasena: this.password });
    }

    onResendConfirmation() {
        if (!this.email) {
            this.messageService.add({
                severity: 'info',
                summary: 'Email requerido',
                detail: 'Por favor, escribe tu correo en el campo de arriba para reenviarte el enlace.'
            });
            
            return;
        }

        // Llamada al store
        this.authStore.resendConfirmationEmail(this.email);

        // Feedback inmediato (o esperar al store si prefieres)
        this.messageService.add({
            severity: 'success',
            summary: 'Enviando',
            detail: 'Si la cuenta existe, recibirás un nuevo correo en breve.'
        });
    }
}
