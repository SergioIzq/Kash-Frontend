import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../../core/stores/auth.store';
import { AuthWrapperComponent } from '../components/auth-wrapper.component';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';

@Component({
    selector: 'app-register-page',
    standalone: true,
    styles: `
        a.hover-underline-force:hover {
            text-decoration: underline !important;
    }`
    ,
    imports: [CommonModule, AuthWrapperComponent, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, ReactiveFormsModule, RouterModule, DividerModule, DialogModule, ScrollPanelModule, BasePageTemplateComponent],
    template: `
        <app-base-page-template [loading]="authStore.loading() && !showSuccessView()" [skeletonType]="'form'">
            <app-auth-wrapper title="Crear cuenta" subtitle="Únete a Kash hoy mismo">
                @if (showSuccessView()) {
                    <div class="w-full md:w-120 flex flex-col items-center text-center animate-fadein">
                        <div class="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                            <i class="pi pi-envelope text-green-600 dark:text-green-300 text-4xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold mb-4 text-surface-900 dark:text-surface-0">¡Revisa tu correo!</h2>
                        <p class="text-muted-color mb-6">
                            Hemos enviado un enlace de confirmación a <strong>{{ registerForm.get('correo')?.value }}</strong
                            >. Activa tu cuenta para poder iniciar sesión.
                        </p>
                        <p-button label="Ir al Login" routerLink="/auth/login" [outlined]="true" styleClass="w-full"></p-button>
                    </div>

                } @else {
                    <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="w-full md:w-120">
                        <div class="flex flex-col gap-5">
                            <div>
                                <label for="nombre" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Nombre</label>
                                <input
                                    pInputText
                                    id="nombre"
                                    formControlName="nombre"
                                    type="text"
                                    placeholder="Tu nombre"
                                    class="w-full"
                                    [ngClass]="{ 'ng-invalid ng-dirty': registerForm.get('nombre')?.touched && registerForm.get('nombre')?.invalid }"
                                />
                                @if (registerForm.get('nombre')?.touched && registerForm.get('nombre')?.hasError('required')) {
                                    <small class="text-red-500 mt-1 block">El nombre es obligatorio.</small>
                                }
                                @if (registerForm.get('nombre')?.touched && registerForm.get('nombre')?.hasError('minlength')) {
                                    <small class="text-red-500 mt-1 block">El nombre debe tener al menos 2 caracteres.</small>
                                }
                            </div>

                            <div>
                                <label for="apellidos" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Apellidos <span class="text-muted-color text-sm">(opcional)</span></label>
                                <input pInputText id="apellidos" formControlName="apellidos" type="text" placeholder="Tus apellidos" class="w-full" />
                            </div>

                            <div>
                                <label for="correo" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Email</label>
                                <input
                                    pInputText
                                    id="correo"
                                    formControlName="correo"
                                    type="text"
                                    placeholder="tu@correo.com"
                                    class="w-full"
                                    [ngClass]="{ 'ng-invalid ng-dirty': registerForm.get('correo')?.touched && registerForm.get('correo')?.invalid }"
                                />
                                @if (registerForm.get('correo')?.touched && registerForm.get('correo')?.hasError('required')) {
                                    <small class="text-red-500 mt-1 block">El correo es obligatorio.</small>
                                }
                                @if (registerForm.get('correo')?.touched && registerForm.get('correo')?.hasError('email')) {
                                    <small class="text-red-500 mt-1 block">Ingresa un correo válido.</small>
                                }
                            </div>

                            <div>
                                <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Contraseña</label>
                                <p-password
                                    id="password"
                                    formControlName="password"
                                    placeholder="Mínimo 6 caracteres"
                                    [toggleMask]="true"
                                    styleClass="w-full"
                                    [fluid]="true"
                                    [feedback]="true"
                                    promptLabel="Ingresa una contraseña"
                                    weakLabel="Débil"
                                    mediumLabel="Regular"
                                    strongLabel="Fuerte"
                                ></p-password>
                                @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('required')) {
                                    <small class="text-red-500 mt-1 block">La contraseña es obligatoria.</small>
                                }
                                @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('minlength')) {
                                    <small class="text-red-500 mt-1 block">La contraseña debe tener al menos 6 caracteres.</small>
                                }
                            </div>

                            <div class="flex items-center mb-2">
                                <p-checkbox formControlName="termsAccepted" id="terms" binary="true" styleClass="mr-2"></p-checkbox>
                                <label for="terms" class="text-surface-900 dark:text-surface-0"> Acepto los <a class="text-primary font-bold hover-underline-force cursor-pointer" (click)="showTerms()">términos y condiciones</a> </label>
                            </div>
                            @if (registerForm.get('termsAccepted')?.touched && registerForm.get('termsAccepted')?.hasError('requiredTrue')) {
                                <small class="text-red-500 mt-1 block">Debes aceptar los términos y condiciones.</small>
                            }

                            <p-button label="Registrarse" type="submit" styleClass="w-full hover-underline-force" class="hover-underline-force" [loading]="authStore.loading()" [disabled]="registerForm.invalid"></p-button>
                        </div>
                    </form>

                    <div class="mt-8 text-center">
                        <p-divider align="center" class="my-4">
                            <span class="text-muted-color text-sm">¿Ya tienes cuenta?</span>
                        </p-divider>
                        <a routerLink="/auth/login" class="font-medium text-primary hover:text-primary-600 cursor-pointer transition-colors hover-underline-force"> Iniciar sesión aquí </a>
                    </div>
                }
        </app-auth-wrapper>
        </app-base-page-template>

        <!-- Términos y Condiciones Dialog -->
        <p-dialog
            header="Términos y Condiciones"
            [(visible)]="termsVisible"
            [modal]="true"
            [style]="{ width: '90vw', maxWidth: '680px' }"
            [draggable]="false"
            [resizable]="false"
        >
            <p-scrollpanel [style]="{ width: '100%', height: '420px' }">
                <div class="flex flex-col gap-4 text-surface-700 dark:text-surface-200 pr-3 text-sm leading-relaxed">

                    <p class="text-muted-color text-xs">Última actualización: marzo 2026</p>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">1. Aceptación de los términos</h3>
                        <p>Al registrarte y utilizar Kash, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de ellos, no utilices la aplicación.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">2. Descripción del servicio</h3>
                        <p>Kash es una aplicación de gestión financiera personal que te permite registrar ingresos, gastos, traspasos e inversiones. La información que introduces es de uso exclusivamente personal y no constituye asesoramiento financiero, legal ni fiscal.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">3. Cuenta de usuario</h3>
                        <p>Eres responsable de mantener la confidencialidad de tus credenciales de acceso. Debes notificarnos inmediatamente cualquier uso no autorizado de tu cuenta. Nos reservamos el derecho de suspender cuentas que incumplan estos términos.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">4. Privacidad y protección de datos</h3>
                        <p>Tus datos se almacenan de forma segura y no son compartidos con terceros sin tu consentimiento. Tratamos tus datos personales de acuerdo con el Reglamento General de Protección de Datos (RGPD) y la normativa española vigente. Puedes solicitar la eliminación de tu cuenta y todos tus datos en cualquier momento.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">5. Uso aceptable</h3>
                        <p>Te comprometes a utilizar Kash únicamente para fines lícitos y personales. Queda prohibido intentar acceder a datos de otros usuarios, realizar ingeniería inversa de la aplicación o utilizarla para actividades fraudulentas.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">6. Exención de responsabilidad</h3>
                        <p>Kash se proporciona «tal cual», sin garantías de ningún tipo. No nos hacemos responsables de decisiones financieras tomadas basándose en la información mostrada por la aplicación. Los datos de mercado (cotizaciones) provienen de fuentes públicas y pueden no ser exactos en tiempo real.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">7. Modificaciones</h3>
                        <p>Podemos actualizar estos términos en cualquier momento. Te notificaremos los cambios significativos. El uso continuado de la aplicación tras la notificación implica la aceptación de los nuevos términos.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-surface-900 dark:text-surface-0 mb-1">8. Ley aplicable</h3>
                        <p>Estos términos se rigen por la legislación española. Cualquier disputa se someterá a los juzgados y tribunales competentes de España.</p>
                    </section>

                </div>
            </p-scrollpanel>

            <ng-template #footer>
                <p-button label="Cerrar" icon="pi pi-times" [outlined]="true" (onClick)="termsVisible = false" />
                <p-button label="Aceptar y cerrar" icon="pi pi-check" (onClick)="acceptTerms()" />
            </ng-template>
        </p-dialog>
    `
})
export class RegisterPage extends BasePageComponent {
    termsVisible = false;

    showTerms(): void {
        this.termsVisible = true;
    }

    acceptTerms(): void {
        this.registerForm.patchValue({ termsAccepted: true });
        this.termsVisible = false;
    }

    authStore = inject(AuthStore);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    
    protected override loadingSignal = this.authStore.loading;
    protected override skeletonType = 'form' as const;
    
    showSuccessView = signal(false);
    
    // No mostrar skeleton si ya hay usuario o si mostramos la vista de éxito
    showSkeleton = computed(() => {
        return this.authStore.loading() && !this.authStore.user() && !this.showSuccessView();
    });
    
    private isSubmitting = false;    registerForm = this.fb.group({
        correo: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        apellidos: [''],
        termsAccepted: [false, [Validators.requiredTrue]]
    });

    constructor() {
        super();
        // Limpiar errores y toasts anteriores al entrar a esta página
        this.authStore.clearError();
        this.messageService.clear();

        // Manejar estado de carga en el formulario
        effect(() => {
            if (this.authStore.loading()) {
                this.registerForm.disable();
            } else {
                this.registerForm.enable();
            }
        });

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

    onRegister() {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.isSubmitting = true;
        const { correo, password, nombre, apellidos } = this.registerForm.value;
        this.authStore.register({
            correo: correo!,
            contrasena: password!,
            nombre: nombre!,
            apellidos: apellidos || undefined
        });
    }
}
