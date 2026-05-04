import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  if (!isAuthRequest) {
    // Use synchronous snapshot to get token
    // Safe to use because auth has been initialized before app routing
    const token = auth.getTokenSnapshot();
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
        router.navigate(['/auth/login']);
      }

      return throwError(() => error);
    })
  );
};
