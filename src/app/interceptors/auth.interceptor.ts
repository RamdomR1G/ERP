import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, map, throwError } from 'rxjs';

/**
 * Interceptor funcional que añade el token JWT a todas las peticiones salientes
 * y desempaqueta el esquema JSON universal { statusCode, intOpCode, data }
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si tenemos un token, clonamos la petición y añadimos la cabecera Authorization
  let finalReq = req;
  if (token) {
    finalReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(finalReq).pipe(
    map(event => {
      // Si la respuesta viene envuelta en el nuevo esquema JSON universal, la desempaquetamos
      if (event instanceof HttpResponse) {
        const body = event.body;
        if (body && typeof body === 'object' && 'data' in body) {
          console.log(`[AuthInterceptor] 📦 Desempaquetando data para: ${req.url}`);
          return event.clone({ body: (body as any).data });
        }
      }
      return event;
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('[AuthInterceptor] ❌ ERROR 401:', error.error);
      }
      return throwError(() => error);
    })
  );
};
