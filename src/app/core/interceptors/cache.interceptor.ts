import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';

interface CachedResponse {
    response: HttpResponse<any>;
    timestamp: number;
}

/**
 * Interceptor HTTP funcional para cache de peticiones GET
 * Optimizado para APIs rápidas (47ms)
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
        return next(req);
    }
    
    // Excluir ciertas URLs del cache
    const excludePatterns = ['/auth/', '/refresh'];
    if (excludePatterns.some(pattern => req.url.includes(pattern))) {
        return next(req);
    }
    
    // Si la URL contiene el parámetro _t (timestamp), no usar caché
    if (req.url.includes('_t=') || req.params.has('_t')) {
        return next(req);
    }
    
    // No cachear peticiones con parámetros de paginación
    if (req.params.has('page') || req.params.has('pageSize')) {
        return next(req);
    }
    
    const cache = getCache();
    // Crear clave de caché incluyendo parámetros para diferenciar peticiones
    const cacheKey = req.urlWithParams;
    const cachedResponse = cache.get(cacheKey);
    
    // Si hay cache válido (menos de 30 segundos), devolverlo
    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < 30000) {
        return new Observable(observer => {
            observer.next(cachedResponse.response.clone());
            observer.complete();
        });
    }
    
    return next(req).pipe(
        tap(event => {
            if (event instanceof HttpResponse) {
                cache.set(cacheKey, {
                    response: event.clone(),
                    timestamp: Date.now()
                });
            }
        })
    );
};

// Cache en memoria
const cache = new Map<string, CachedResponse>();

function getCache(): Map<string, CachedResponse> {
    return cache;
}

// Limpiar cache periódicamente
setInterval(() => {
    const now = Date.now();
    for (const [url, cached] of cache.entries()) {
        if (now - cached.timestamp > 60000) { // 1 minuto
            cache.delete(url);
        }
    }
}, 60000);

import { Observable } from 'rxjs';
