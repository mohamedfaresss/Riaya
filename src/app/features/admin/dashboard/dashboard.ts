import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BookingRefreshService } from '../../../core/services/booking-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../shared/models/booking.model';

interface AdminStats {
  totalDoctors: number;
  totalPatients: number;
  totalBookings: number;
  pendingBookings: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatSnackBarModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly bookingRefreshService = inject(BookingRefreshService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly isAdmin: boolean = this.authService.getUserRoleSnapshot() === 'Admin';
  protected loading = true;
  protected stats: AdminStats | null = null;
  protected recentBookings: Booking[] = [];

  ngOnInit(): void {
    this.fetchDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ stats, bookings }) => {
          this.stats = stats;
          this.recentBookings = (bookings ?? []).slice(0, 8);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });

    this.bookingRefreshService.changes$.pipe(
      switchMap(() => this.fetchDashboard()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ stats, bookings }) => {
        this.stats = stats;
        this.recentBookings = (bookings ?? []).slice(0, 8);
        this.cdr.detectChanges();
      }
    });
  }

  private fetchDashboard() {
    return forkJoin({
      stats: this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`)
        .pipe(catchError(() => of(null))),
      bookings: this.http.get<Booking[]>(`${environment.apiUrl}/bookings/my`)
        .pipe(catchError(() => of([])))
    });
  }

  protected getInitials(name?: string): string {
    const tokens = (name || '').split(' ').filter(Boolean);
    return (tokens[0]?.[0] ?? '') + (tokens[1]?.[0] ?? '');
  }

  protected getStatusLabel(status: number | string): string {
    const name = this.getStatusName(status);
    return name === 'Pending' ? 'Waiting' : name;
  }

  protected getStatusName(status: number | string): string {
    if (typeof status === 'string') return status;
    const map: Record<number, string> = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled', 3: 'Completed' };
    return map[status] ?? 'Unknown';
  }

  protected getStatusClass(status: number | string): string {
    return this.getStatusName(status).toLowerCase();
  }
}