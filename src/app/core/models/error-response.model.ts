export interface ErrorResponse
{
    code:string;
    title: string;
    detail: string;
    traceId?: string;
    timestamp: Date;
}

/**
 * Error HTTP tal como llega a los handlers de error de RxJS/tapResponse,
 * enriquecido por el interceptor con `userMessage`. Reemplaza los `any` de los
 * `catch`/`error` sin perder acceso a los campos que realmente se leen.
 */
export interface HttpErrorLike {
    userMessage?: string;
    message?: string;
    detail?: string;
}