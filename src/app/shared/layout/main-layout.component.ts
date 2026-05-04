import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

type AppRole = 'patient' | 'doctor' | 'admin';
type NavIcon = 'dashboard' | 'doctor' | 'bookings' | 'profile' | 'schedule' | 'patients' | 'add';

interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  exact?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  mobileMenuOpen = false;
  readonly role: AppRole;
  readonly themeClass: string;
  readonly portalLabel: string;
  readonly navItems: NavItem[];

  private readonly navByRole: Record<AppRole, NavItem[]> = {
    patient: [
      { label: 'Dashboard', route: '/patient/dashboard', icon: 'dashboard', exact: true },
      { label: 'Find Doctor', route: '/patient/doctors', icon: 'doctor', exact: true },
      { label: 'My Bookings', route: '/patient/bookings', icon: 'bookings', exact: true },
      { label: 'Profile', route: '/patient/profile', icon: 'profile', exact: true }
    ],
    doctor: [
      { label: 'Dashboard', route: '/doctor/dashboard', icon: 'dashboard', exact: true },
      { label: 'My Schedule', route: '/doctor/schedule', icon: 'schedule', exact: true },
      { label: 'Appointments', route: '/doctor/appointments', icon: 'bookings', exact: true },
      { label: 'Profile', route: '/doctor/profile', icon: 'profile', exact: true }
    ],
    admin: [
      { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard', exact: true },
      { label: 'Manage Doctors', route: '/admin/doctors', icon: 'doctor', exact: true },
      { label: 'Add Doctor', route: '/admin/add-doctor', icon: 'add', exact: true },
      { label: 'Manage Patients', route: '/admin/patients', icon: 'patients', exact: true },
      { label: 'All Bookings', route: '/admin/bookings', icon: 'bookings', exact: true },
      { label: 'Profile', route: '/admin/profile', icon: 'profile', exact: true }
    ]
  };

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.role = this.resolveRole();
    this.themeClass = `theme-${this.role}`;
    this.portalLabel = this.getPortalLabel(this.role);
    this.navItems = this.navByRole[this.role];
  }

  logout() {
    this.mobileMenuOpen = false;
    this.auth.logout();
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  trackByRoute(_: number, item: NavItem) {
    return item.route;
  }

  isRouteActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  private getPortalLabel(role: AppRole): string {
    if (role === 'doctor') return 'Doctor Portal';
    if (role === 'admin') return 'Admin Portal';
    return 'Patient Portal';
  }

  private resolveRole(): AppRole {
    const role = (this.auth.getUserRole() || '').toLowerCase();
    if (role === 'doctor' || role === 'admin' || role === 'patient') {
      return role;
    }
    return 'patient';
  }
}
