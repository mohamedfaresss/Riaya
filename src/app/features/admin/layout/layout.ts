import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface AdminNavItem {
  label: string;
  route: string;
  icon: 'dashboard' | 'doctors' | 'patients' | 'bookings';
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class AdminLayout {
  protected mobileDrawerOpen = false;
  protected readonly navItems: AdminNavItem[] = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Manage Doctors', route: '/admin/doctors', icon: 'doctors' },
    { label: 'Manage Patients', route: '/admin/patients', icon: 'patients' },
    { label: 'All Bookings', route: '/admin/bookings', icon: 'bookings' }
  ];

  constructor(private auth: AuthService) {}

  protected toggleMobileDrawer() {
    this.mobileDrawerOpen = !this.mobileDrawerOpen;
  }

  protected closeMobileDrawer() {
    this.mobileDrawerOpen = false;
  }

  protected logout() {
    this.mobileDrawerOpen = false;
    this.auth.logout();
  }
}
