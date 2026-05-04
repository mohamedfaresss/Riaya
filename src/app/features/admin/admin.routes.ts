import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
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
        path: 'add-doctor',
        loadComponent: () => import('./add-doctor/add-doctor-page').then(m => m.AddDoctorPage)
      },
      {
        path: 'patients',
        loadComponent: () => import('./patients/patients').then(m => m.Patients)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./bookings/bookings').then(m => m.Bookings)
      },
      {
        // ✅ صلحنا الـ profile — بدل redirectTo
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.AdminProfile)
      },
      // ── Redirects ──────────────────────────────────────
      { path: 'users',       redirectTo: 'doctors',    pathMatch: 'full' },
      { path: 'doctors/add', redirectTo: 'add-doctor', pathMatch: 'full' }
    ]
  }
];