# 💸 Kash UI - Financial Management SPA

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NgRx](https://img.shields.io/badge/NgRx-BA2BD2?style=for-the-badge&logo=redux&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

> **Interfaz moderna y reactiva para la gestión financiera personal.**

Este proyecto es la **capa de presentación (Frontend)** del ecosistema **Kash**. Es una Single Page Application (SPA) desarrollada con las últimas características de **Angular (v19/20)**, enfocada en el rendimiento, la reactividad granular mediante **Signals** y una gestión de estado robusta.

---

### 🔗 Conexión con Backend
Esta UI consume la API RESTful construida con .NET Core y Arquitectura Hexagonal.
👉 **Puedes ver el código del Backend aquí:** [🔗 [backend](https://github.com/SergioIzq/Kash-Backend)]

---

## 🚀 Stack Tecnológico & Arquitectura

El proyecto va más allá de un simple CRUD, implementando patrones de diseño modernos para escalabilidad y mantenimiento:

* **Framework:** **Angular 20** (Bleeding Edge).
* **Gestión de Estado:** **NgRx** implementado con orientación total a **Signals** para una reactividad sin zonas (Zone-less ready).
* **Arquitectura:**
    * **Standalone Components:** Sin `NgModules`, reduciendo el boilerplate.
    * **Modular Services:** Inyección de dependencias optimizada.
* **UI/UX:** Diseño basado en componentes reutilizables y PrimeNG/Sakai.
* **Infraestructura:**
    * Dockerización multi-stage para optimizar el tamaño de la imagen.
    * Servidor **Nginx** de alto rendimiento como Reverse Proxy.

## 🛠️ Instalación y Desarrollo Local

Asegúrate de tener instalado **Node.js** y **npm**.

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/kash-ui.git](https://github.com/tu-usuario/kash-ui.git)
    cd kash-ui
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Arrancar servidor de desarrollo:**
    ```bash
    ng serve
    ```
    Navega a `http://localhost:4200/`. La aplicación recargará automáticamente si cambias algún archivo fuente.

## 🐳 Despliegue con Docker (Producción)

Este proyecto está configurado para desplegarse en cualquier entorno compatible con contenedores (VPS Linux, Azure, AWS).

### 1. Construir la imagen
```bash
docker build -t kash-ui .
