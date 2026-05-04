import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedInSnapshot()) return true;
  return router.createUrlTree(['/auth/login']);
};

export const roleGuard = (role: string) => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRole = role.trim().toLowerCase();

  if (!auth.isLoggedInSnapshot()) {
    return router.createUrlTree(['/auth/login']);
  }

  if ((auth.getUserRoleSnapshot() || '').toLowerCase() === expectedRole) return true;

  const userRole = (auth.getUserRoleSnapshot() || '').toLowerCase();
  if (userRole === 'patient') return router.createUrlTree(['/patient/dashboard']);
  if (userRole === 'doctor') return router.createUrlTree(['/doctor/dashboard']);
  if (userRole === 'admin') return router.createUrlTree(['/admin/dashboard']);

  return router.createUrlTree(['/auth/login']);
};
