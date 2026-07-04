import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LegalPageLayoutComponent } from './legal-page-layout.component';

@Component({
    selector: 'app-aviso-legal',
    standalone: true,
    imports: [CommonModule, RouterModule, LegalPageLayoutComponent],
    template: `
        <app-legal-page-layout title="Aviso Legal">
            <div class="legal-content line-height-3 text-700">

                <h3>1. Datos identificativos</h3>
                <p>
                    En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de
                    julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se
                    facilitan los siguientes datos:
                </p>
                <ul>
                    <li><strong>Titular:</strong> Sergio Izquierdo</li>
                    <li><strong>Correo electrónico de contacto:</strong> sergioizq.dev@gmail.com</li>
                    <li><strong>Sitio web:</strong> <a href="https://sergioizq.com" target="_blank" rel="noopener">sergioizq.com</a></li>
                </ul>

                <h3>2. Objeto</h3>
                <p>
                    Kash ("la Aplicación") es una herramienta de gestión financiera personal que permite al usuario
                    registrar y consultar sus ingresos, gastos, cuentas y operaciones económicas. El acceso y uso de
                    la Aplicación atribuye la condición de usuario e implica la aceptación de este Aviso Legal, de la
                    <a routerLink="/legal/privacidad">Política de Privacidad</a> y de la
                    <a routerLink="/legal/cookies">Política de Cookies</a>.
                </p>

                <h3>3. Condiciones de uso</h3>
                <p>
                    El usuario se compromete a hacer un uso adecuado y lícito de la Aplicación, a facilitar información
                    veraz en el proceso de registro y a mantener la confidencialidad de sus credenciales de acceso.
                    Kash es una herramienta de apoyo a la gestión personal de las finanzas del usuario; los datos e
                    importes mostrados dependen enteramente de la información que el propio usuario introduce y no
                    constituyen asesoramiento financiero, fiscal ni de inversión.
                </p>

                <h3>4. Propiedad intelectual</h3>
                <p>
                    El código fuente, diseño, logotipos, marca "Kash" y demás contenidos de la Aplicación son
                    titularidad de su desarrollador o se utilizan con la debida autorización. Queda prohibida su
                    reproducción, distribución o transformación sin autorización expresa, salvo lo dispuesto en la
                    licencia de código abierto que, en su caso, acompañe al proyecto.
                </p>

                <h3>5. Exclusión de responsabilidad</h3>
                <p>
                    El titular no garantiza la disponibilidad, continuidad ni infalibilidad del funcionamiento de la
                    Aplicación y, por tanto, excluye, en la medida en que lo permita el ordenamiento jurídico,
                    cualquier responsabilidad por los daños y perjuicios que puedan derivarse de la falta de
                    disponibilidad o de continuidad del servicio, o de errores en los datos introducidos por el
                    propio usuario.
                </p>

                <h3>6. Legislación aplicable y jurisdicción</h3>
                <p>
                    Las presentes condiciones se rigen por la legislación española. Para la resolución de cualquier
                    controversia derivada del acceso o uso de la Aplicación, las partes se someterán a los juzgados y
                    tribunales que correspondan conforme a la normativa de protección de consumidores aplicable.
                </p>
            </div>
        </app-legal-page-layout>
    `
})
export class AvisoLegalPage {}
