import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LegalPageLayoutComponent } from './legal-page-layout.component';

@Component({
    selector: 'app-politica-cookies',
    standalone: true,
    imports: [CommonModule, RouterModule, LegalPageLayoutComponent],
    template: `
        <app-legal-page-layout title="Política de Cookies">
            <div class="legal-content line-height-3 text-700">
                <h3>1. ¿Qué usa Kash?</h3>
                <p>
                    Kash <strong>no utiliza cookies de terceros, publicitarias ni de analítica</strong>. Para
                    funcionar, la Aplicación usa exclusivamente almacenamiento técnico necesario del navegador
                    (<code>localStorage</code>) y, si el usuario la instala como aplicación web progresiva (PWA), un
                    <em>Service Worker</em> para permitir su uso sin conexión. Ninguna de estas tecnologías se emplea
                    para elaborar perfiles ni para seguimiento publicitario.
                </p>

                <h3>2. Detalle del almacenamiento técnico utilizado</h3>
                <table class="w-full text-sm" style="border-collapse: collapse">
                    <thead>
                        <tr class="text-left">
                            <th class="p-2 border-bottom-1 surface-border">Elemento</th>
                            <th class="p-2 border-bottom-1 surface-border">Finalidad</th>
                            <th class="p-2 border-bottom-1 surface-border">Duración</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="p-2 border-bottom-1 surface-border">Sesión / token de acceso</td>
                            <td class="p-2 border-bottom-1 surface-border">Mantener al usuario identificado entre visitas, evitando iniciar sesión constantemente.</td>
                            <td class="p-2 border-bottom-1 surface-border">Hasta cerrar sesión o expirar el token.</td>
                        </tr>
                        <tr>
                            <td class="p-2 border-bottom-1 surface-border">Preferencias de interfaz</td>
                            <td class="p-2 border-bottom-1 surface-border">Recordar ajustes visuales de la aplicación (por ejemplo, tema claro/oscuro).</td>
                            <td class="p-2 border-bottom-1 surface-border">Persistente, hasta que el usuario la borre.</td>
                        </tr>
                        <tr>
                            <td class="p-2 border-bottom-1 surface-border">Aviso de cookies aceptado</td>
                            <td class="p-2 border-bottom-1 surface-border">Recordar que el usuario ya ha visto y cerrado este aviso.</td>
                            <td class="p-2 border-bottom-1 surface-border">Persistente, hasta que el usuario la borre.</td>
                        </tr>
                        <tr>
                            <td class="p-2">Caché de la aplicación (Service Worker)</td>
                            <td class="p-2">Permitir que la aplicación cargue más rápido y funcione parcialmente sin conexión.</td>
                            <td class="p-2">Hasta que se actualice o desinstale la aplicación.</td>
                        </tr>
                    </tbody>
                </table>

                <h3>3. Base legal</h3>
                <p>
                    Al tratarse de almacenamiento estrictamente necesario para la prestación del servicio solicitado
                    por el propio usuario (mantener la sesión y permitir el funcionamiento de la aplicación), no
                    requiere consentimiento previo conforme al artículo 22.2 de la LSSI-CE, si bien se informa de su
                    uso mediante el aviso mostrado en la Aplicación.
                </p>

                <h3>4. Cómo eliminar este almacenamiento</h3>
                <p>
                    El usuario puede borrar en cualquier momento los datos almacenados por Kash en su navegador desde
                    los ajustes de privacidad/almacenamiento del propio navegador ("Borrar datos de navegación" o
                    equivalente). Ten en cuenta que, al hacerlo, se cerrará tu sesión y deberás volver a iniciarla.
                </p>

                <h3>5. Cambios en esta política</h3>
                <p>
                    Si en el futuro Kash incorporase servicios de analítica o de terceros, esta página se actualizará
                    para reflejarlo y, en ese caso, se solicitará el consentimiento del usuario cuando la normativa
                    lo exija.
                </p>
            </div>
        </app-legal-page-layout>
    `
})
export class PoliticaCookiesPage {}
