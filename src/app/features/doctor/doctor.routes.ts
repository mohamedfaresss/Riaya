import { Routes } from '@angular/router';

export const DOCTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../shared/layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./schedule/schedule').then(m => m.Schedule)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./bookings/bookings').then(m => m.Bookings)
      },
      {
        path: 'bookings',
        redirectTo: 'appointments',
        pathMatch: 'full'
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.Profile)
      }
    ]
  }
];
