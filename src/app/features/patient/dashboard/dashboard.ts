import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, filter, take, catchError, map } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BookingRefreshService } from '../../../core/services/booking-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../shared/models/booking.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly bookingRefreshService = inject(BookingRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  bookings: Booking[] = [];
  loading = true;
  userName = '';

ngOnInit(): void {
  this.userName = this.authService.getUserFirstName();

  // ✅ مش محتاج filter أو take — APP_INITIALIZER كافي
  this.fetchBookings()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: data => {
        this.bookings = data ?? [];
        this.loading = false;
          this.cdr.detectChanges(); // ← ضيف ده

      },
      error: () => { this.loading = false; },
    });

  this.bookingRefreshService.changes$.pipe(
    switchMap(() => this.fetchBookings()),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe({
    next: data => { this.bookings = data ?? []; }
  });
}
private fetchBookings() {
  return this.http.get<Booking[]>(`${environment.apiUrl}/bookings/my`)
    .pipe(
      map(data => data ?? []),
      catchError(() => of([]))
    );
}

  getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  get pendingCount(): number { return this.bookings.filter(b => this.getStatusName(b.status) === 'Pending').length; }
  get confirmedCount(): number { return this.bookings.filter(b => this.getStatusName(b.status) === 'Confirmed').length; }

  getStatusName(status: number | string): string {
    if (typeof status === 'string') return status;
    const map: Record<number, string> = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled', 3: 'Completed' };
    return map[status] ?? 'Unknown';
  }

  getStatusClass(status: number | string): string { return this.getStatusName(status).toLowerCase(); }
}