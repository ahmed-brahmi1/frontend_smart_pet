import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

function isAdmin(): boolean {
  const user = inject(AuthService).getCurrentUser();
  return user?.role != null && String(user.role).toUpperCase() === 'ADMIN';
}

/**
 * When applied to the dashboard route: redirects admins to System Health
 * so they never see the user dashboard.
 */
export const dashboardRedirectGuard: CanActivateFn = () => {
  if (isAdmin()) {
    return inject(Router).createUrlTree(['/admin/system-health']);
  }
  return true;
};

/**
 * For the empty path (''): redirect to System Health for admins, dashboard for others.
 */
export const defaultRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  return router.createUrlTree(
    isAdmin() ? ['/admin/system-health'] : ['/dashboard']
  );
};
