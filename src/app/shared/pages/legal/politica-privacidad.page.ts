import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LegalPageLayoutComponent } from './legal-page-layout.component';

@Component({
    selector: 'app-politica-privacidad',
    standalone: true,
    imports: [CommonModule, RouterModule, LegalPageLayoutComponent],
    template: `
        <app-legal-page-layout title="Política de Privacidad">
            <div class="legal-content line-height-3 text-700">

                <h3>1. Responsable del tratamiento</h3>
                <ul>
                    <li><strong>Responsable:</strong> Sergio Izquierdo</li>
                    <li><strong>Correo electrónico de contacto:</strong> sergioizq.dev@gmail.com</li>
                </ul>

                <h3>2. Datos que se tratan</h3>
                <p>Al usar Kash se tratan los siguientes datos, siempre facilitados directamente por el usuario:</p>
                <ul>
                    <li><strong>Datos de registro:</strong> nombre, apellidos (opcional) y correo electrónico.</li>
                    <li><strong>Credenciales:</strong> contraseña, almacenada siempre cifrada (hash), nunca en texto plano.</li>
                    <li>
                        <strong>Datos financieros introducidos por el usuario:</strong> gastos, ingresos, cuentas,
                        traspasos, categorías, conceptos, proveedores, clientes e inversiones que el propio usuario
                        registra para gestionar sus finanzas.
                    </li>
                    <li><strong>Foto de perfil</strong>, si el usuario decide subir una.</li>
                </ul>
                <p>
                    Kash no solicita ni trata categorías especiales de datos (salud, ideología, etc.) ni datos de
                    terceras personas ajenas al propio usuario, salvo los nombres que el usuario decida introducir
                    libremente como "Personas", "Clientes" o "Proveedores" para clasificar sus propias operaciones.
                </p>

                <h3>3. Finalidad del tratamiento</h3>
                <ul>
                    <li>Gestionar el registro, autenticación y acceso a la cuenta del usuario.</li>
                    <li>Prestar el servicio de gestión financiera personal solicitado (registrar y mostrar sus operaciones).</li>
                    <li>Enviar notificaciones funcionales del propio servicio (por ejemplo, confirmación de correo o aviso de ejecución de un gasto/ingreso programado).</li>
                    <li>Mantener la seguridad técnica de la Aplicación.</li>
                </ul>
                <p>Los datos no se utilizan para elaborar perfiles con fines publicitarios ni se ceden a terceros con fines comerciales.</p>

                <h3>4. Legitimación</h3>
                <p>
                    La base jurídica del tratamiento es la ejecución del contrato/relación de uso que el usuario
                    acepta al registrarse (art. 6.1.b RGPD), así como el consentimiento del propio usuario al crear
                    la cuenta.
                </p>

                <h3>5. Conservación de los datos</h3>
                <p>
                    Los datos se conservan mientras la cuenta del usuario permanezca activa. Si el usuario solicita
                    la eliminación de su cuenta, sus datos se suprimirán o anonimizarán salvo obligación legal de
                    conservación aplicable.
                </p>

                <h3>6. Destinatarios y encargados del tratamiento</h3>
                <p>
                    Los datos se almacenan en una base de datos gestionada por el responsable del servicio.
                    <strong>No se comparten datos con redes sociales, plataformas de analítica ni de publicidad</strong>,
                    ya que Kash no integra dichos servicios. En caso de utilizar un proveedor de hosting o
                    infraestructura en la nube como encargado del tratamiento, dicho proveedor se detallará aquí:
                    Contabo.
                </p>

                <h3>7. Derechos de las personas usuarias</h3>
                <p>
                    El usuario puede ejercer en cualquier momento sus derechos de acceso, rectificación, supresión,
                    oposición, limitación del tratamiento y portabilidad de sus datos:
                </p>
                <ul>
                    <li>Directamente desde la Aplicación, en la sección "Mi Perfil", para consultar y actualizar sus datos.</li>
                    <li>Solicitando la eliminación de la cuenta, que conlleva la supresión de sus datos personales.</li>
                    <li>Escribiendo a sergioizq.dev@gmail.com para cualquier otra solicitud relativa a sus datos.</li>
                </ul>
                <p>
                    El usuario también tiene derecho a presentar una reclamación ante la Agencia Española de
                    Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener">www.aepd.es</a>)
                    si considera que el tratamiento de sus datos no se ajusta a la normativa vigente.
                </p>

                <h3>8. Seguridad</h3>
                <p>
                    Se aplican medidas técnicas y organizativas razonables para proteger los datos personales, entre
                    ellas el cifrado de contraseñas, el uso de conexiones seguras (HTTPS) y la autenticación mediante
                    tokens (JWT) para el acceso a la API.
                </p>
            </div>
        </app-legal-page-layout>
    `
})
export class PoliticaPrivacidadPage {}
