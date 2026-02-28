import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

const apiUrl = environment.apiUrl;
const publicPaths = ['/auth/login', '/auth/register'];

function isRequestToApi(url: string): boolean {
  return url.startsWith(apiUrl);
}

function isPublicPath(url: string): boolean {
  if (!isRequestToApi(url)) return false;
  const path = url.slice(apiUrl.length).split('?')[0];
  return publicPaths.some((p) => path === p || path.startsWith(p + '?'));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isRequestToApi(req.url)) {
    return next(req);
  }
  if (isPublicPath(req.url)) {
    return next(req);
  }
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
