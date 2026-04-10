import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor funcional que añade el token JWT a todas las peticiones salientes
 * dirigidas al API Gateway.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log(`[AuthInterceptor] Interceptando req: ${req.url} | Token presente: ${!!token}`);

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
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.error('[AuthInterceptor] ❌ ERROR 401 DETALLES:', error.error);
        if (error.error?.details) {
            console.error('[AuthInterceptor] 💡 CAUSA JWT:', error.error.details);
        }
      }
      return throwError(() => error);
    })
  );
};
