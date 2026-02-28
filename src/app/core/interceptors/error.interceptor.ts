import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Backend error response shape when message is present */
interface BackendErrorBody {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

function getMessage(err: HttpErrorResponse): string {
  const body = err.error as BackendErrorBody | null;
  if (body?.message) {
    return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  }
  if (typeof body?.error === 'string') return body.error;
  return err.message || 'An error occurred';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === HttpStatusCode.Unauthorized) {
        auth.clearSession();
        router.navigate(['/']);
        return throwError(() => new Error(getMessage(err)));
      }
      const message = getMessage(err);
      return throwError(() => new Error(message));
    })
  );
};
