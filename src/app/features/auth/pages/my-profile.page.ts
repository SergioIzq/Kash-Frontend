import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { FileUploadHandlerEvent, FileUploadModule, FileUpload } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';

// Tu Arquitectura
import { AuthStore } from '@/core/stores/auth.store';
import { BasePageComponent, BasePageTemplateComponent } from '@/shared/components';

@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule, AvatarModule, FileUploadModule, DividerModule, InputIconModule, IconFieldModule, BasePageTemplateComponent],
    template: `
        <app-base-page-template [loading]="loadingSignal() || isLoadingInitial()" [skeletonType]="'profile'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-2 md:gap-x-2">
                <!-- Card 1: Avatar y Correo -->
                <div class="card surface-card shadow-2 border-round p-6 h-full">
                    <div class="grid grid-flow-col grid-rows-1 gap-4">
                        <div class="flex flex-column align-items-center justify-content-center mb-6 pb-5 border-bottom-1 surface-border">
                            <div class="relative mb-3 cursor-pointer group" (click)="fileUploader.basicFileInput?.nativeElement.click()">
                                <p-avatar
                                    [label]="!authStore.user()?.avatar ? authStore.userInitials() : undefined"
                                    [image]="authStore.user()?.avatar || undefined"
                                    shape="circle"
                                    size="xlarge"
                                    class="shadow-4"
                                    [style]="{
                                        width: '120px',
                                        height: '120px',
                                        'font-size': '3rem',
                                        'object-fit': 'cover',
                                        'background-color': 'var(--primary-color)',
                                        color: 'var(--primary-contrast-color)'
                                    }"
                                ></p-avatar>
                            </div>

                            <p-fileUpload #fileUploader mode="basic" name="avatar" accept="image/*" maxFileSize="5000000" [auto]="true" [customUpload]="true" (uploadHandler)="onUploadAvatar($event)" class="hidden"></p-fileUpload>
                        </div>

                        <div class="text-center col-span-2">
                            <h2 class="text-900 font-bold text-2xl mb-1 mt-0">{{ authStore.userName() }}</h2>
                            <span class="text-600 font-medium">{{ authStore.user()?.correo }}</span>
                            <div class="mt-2">
                                <span class="inline-flex align-items-center justify-content-center px-2 py-1 bg-primary-100 text-primary-700 border-round font-medium text-xs">
                                    {{ authStore.user()?.rol || 'Usuario' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <form [formGroup]="form" class="p-fluid">
                        <div class="field mb-0">
                            <label for="correo" class="font-medium text-900 mb-2 block">Correo Electrónico</label>
                            <p-iconField iconPosition="left">
                                <p-inputIcon styleClass="pi pi-envelope" />
                                <input pInputText id="correo" formControlName="correo" [readonly]="true" class="w-full bg-gray-50 text-color-secondary" />
                            </p-iconField>
                            <small class="text-500 mt-1 block">El correo electrónico es tu identificador único y no se puede modificar.</small>
                        </div>
                    </form>
                </div>

                <!-- Card 2: Información Personal -->
                <div class="card surface-card shadow-2 border-round p-6 h-full">
                    <h3 class="text-900 font-semibold text-xl mb-4">Información Personal</h3>

                    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-fluid">
                        <div class="field mb-4">
                            <label for="nombre" class="font-medium text-900 mb-2 block">Nombre</label>
                            <p-iconField iconPosition="left">
                                <p-inputIcon class="pi pi-user" />
                                <input pInputText id="nombre" formControlName="nombre" placeholder="Tu nombre" class="w-full" />
                            </p-iconField>
                            @if (form.get('nombre')?.touched && form.get('nombre')?.invalid) {
                                <small class="text-red-500 block mt-1">El nombre es requerido.</small>
                            }
                        </div>

                        <div class="field mb-4">
                            <label for="apellidos" class="font-medium text-900 mb-2 block">Apellidos</label>
                            <p-iconField iconPosition="left">
                                <p-inputIcon styleClass="pi pi-id-card" />
                                <input pInputText id="apellidos" formControlName="apellidos" placeholder="Tus apellidos" class="w-full" />
                            </p-iconField>
                        </div>

                        <div class="flex justify-content-end gap-3 mt-4 pt-3 border-top-1 surface-border">
                            <p-button label="Deshacer" icon="pi pi-refresh" severity="secondary" [outlined]="true" (onClick)="loadUserData()"></p-button>
                            <p-button label="Guardar" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="form.invalid || form.pristine"></p-button>
                        </div>
                    </form>
                </div>
            </div>
        </app-base-page-template>
    `
})
export class MyProfilePage extends BasePageComponent implements OnInit {
    authStore = inject(AuthStore);
    private fb = inject(FormBuilder);

    @ViewChild('fileUploader') fileUploader!: FileUpload;

    protected override loadingSignal = this.authStore.loading;
    protected override skeletonType = 'profile' as const;

    saving = signal(false);
    isLoadingInitial = signal(true);

    form = this.fb.group({
        correo: ['', [Validators.required, Validators.email]],
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        apellidos: ['']
    });

    ngOnInit() {
        this.loadUserData();
        // Marca como no cargando después de cargar datos iniciales
        setTimeout(() => this.isLoadingInitial.set(false), 100);
    }

    loadUserData() {
        const user = this.authStore.user();
        if (user) {
            this.form.patchValue({
                correo: user.correo,
                nombre: user.nombre,
                apellidos: user.apellidos || ''
            });
            this.form.get('correo')?.disable();
        }
    }

    async onSubmit() {
        if (this.form.invalid) return;

        this.saving.set(true);
        const { nombre, apellidos } = this.form.getRawValue();

        try {
            await this.authStore.updateProfile({ nombre: nombre!, apellidos: apellidos || null });

            // Actualización optimista
            const currentUser = this.authStore.user();
            if (currentUser) {
                this.authStore.setUser({ ...currentUser, nombre: nombre!, apellidos: apellidos || undefined });
            }

            this.showSuccess('Tu perfil ha sido modificado.', 'Actualizado');
            this.form.markAsPristine();
        } catch (error) {
            console.error(error);
        } finally {
            this.saving.set(false);
        }
    }

    async onUploadAvatar(event: FileUploadHandlerEvent) {
        const file = event.files[0];
        if (!file) return;

        try {
            // Llamamos al store para subir la imagen
            await this.authStore.updateAvatar(file);

            this.showSuccess('Tu foto de perfil se ha actualizado.', 'Avatar Actualizado');

            // Limpiamos el componente de subida visualmente (opcional, ya que mode=basic se limpia solo)
            // event.originalEvent.target.value = '';
        } catch (error: any) {
            console.error(error);
            this.showError('No se pudo subir la imagen.');
        }
    }
}
