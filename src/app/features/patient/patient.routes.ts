import { Routes } from '@angular/router';

export const PATIENT_ROUTES: Routes = [
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
        path: 'doctors',
        loadComponent: () => import('./doctors/doctors').then(m => m.Doctors)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./bookings/bookings').then(m => m.Bookings)
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.Profile)
      }
    ]
  }
];
