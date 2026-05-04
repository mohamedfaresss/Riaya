import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'patient',
    canActivate: [() => roleGuard('Patient')()],
    loadChildren: () => import('./features/patient/patient.routes').then(m => m.PATIENT_ROUTES)
  },
  {
    path: 'doctor',
    canActivate: [() => roleGuard('Doctor')()],
    loadChildren: () => import('./features/doctor/doctor.routes').then(m => m.DOCTOR_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [() => roleGuard('Admin')()],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
