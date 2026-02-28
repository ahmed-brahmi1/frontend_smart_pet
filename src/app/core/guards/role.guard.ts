import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role guard: allow access only if the current user has one of the allowed roles.
 * Use in routes: canActivate: [authGuard, roleGuard(['ADMIN'])]
 * If the user is not authenticated, authGuard should run first and redirect to login.
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.getCurrentUser();
    if (!user) {
      router.navigate(['/']);
      return false;
    }
    const role = (user.role ?? '').toUpperCase();
    const allowed = allowedRoles.map((r) => r.toUpperCase());
    if (allowed.length === 0 || allowed.includes(role)) {
      return true;
    }
    router.navigate(['/']);
    return false;
  };
}
