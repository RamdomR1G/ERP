import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/**
 * Este interceptor extrae automáticamente el campo 'data' de las respuestas 
 * que siguen el esquema universal { statusCode, intOpCode, data }.
 * Permite que los servicios sigan funcionando sin cambios.
 */
export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (
        event instanceof HttpResponse && 
        event.body && 
        typeof event.body === 'object' && 
        'data' in event.body &&
        'statusCode' in event.body
      ) {
        // Clonamos la respuesta pero devolviendo solo el contenido de 'data'
        return event.clone({ body: event.body.data });
      }
      return event;
    })
  );
};
