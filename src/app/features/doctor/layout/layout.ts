import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface DoctorNavItem {
  label: string;
  route: string;
  icon: 'dashboard' | 'schedule' | 'appointments' | 'profile';
}

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class DoctorLayout {
  protected mobileDrawerOpen = false;
  protected readonly navItems: DoctorNavItem[] = [
    { label: 'Dashboard', route: '/doctor/dashboard', icon: 'dashboard' },
    { label: 'My Schedule', route: '/doctor/schedule', icon: 'schedule' },
    { label: 'Appointments', route: '/doctor/appointments', icon: 'appointments' },
    { label: 'Profile', route: '/doctor/profile', icon: 'profile' }
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
