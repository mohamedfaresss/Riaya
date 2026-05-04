import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BookingRefreshService } from '../../../core/services/booking-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../shared/models/booking.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly bookingRefreshService = inject(BookingRefreshService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected bookings: Booking[] = [];
  protected upcomingBookings: Booking[] = [];
  protected loading = true;
  protected userName = '';
  protected total = 0;
  protected pending = 0;
  protected confirmed = 0;
  protected completed = 0;
  protected today = 0;

  ngOnInit() {
    this.userName = this.authService.getUserName();

    this.fetchBookings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.applyData(data);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });

    this.bookingRefreshService.changes$.pipe(
      switchMap(() => this.fetchBookings()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => { this.applyData(data); this.cdr.detectChanges(); }
    });
  }

  private fetchBookings() {
    return this.http.get<Booking[]>(`${environment.apiUrl}/bookings/my`).pipe(
      map(data => (data ?? []).map(b => ({ ...b, status: this.normalizeStatus(b.status) }))),
      catchError(() => of([]))
    );
  }

  private applyData(data: Booking[]) {
    this.bookings = data;
    this.upcomingBookings = data
      .filter(b => b.status !== 2 && b.status !== 3)
      .sort((a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime())
      .slice(0, 5);
    this.calculateStats();
  }

  private calculateStats() {
    this.total = this.bookings.length;
    this.pending = this.bookings.filter(b => b.status === 0).length;
    this.confirmed = this.bookings.filter(b => b.status === 1).length;
    this.completed = this.bookings.filter(b => b.status === 3).length;
    this.today = this.bookings.filter(b => this.isToday(b.startAtUtc)).length;
  }

  private normalizeStatus(status: number | string | undefined): number {
    if (typeof status === 'number') return status;
    const map: Record<string, number> = { Pending: 0, Confirmed: 1, Cancelled: 2, Completed: 3 };
    return map[status as string] ?? -1;
  }

  private isToday(date: string): boolean {
    const d = new Date(date), now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  protected get pendingCount() { return this.pending; }
  protected get confirmedCount() { return this.confirmed; }
  protected get todayCount() { return this.today; }

  protected getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  protected getInitials(name?: string): string {
    const tokens = (name || '').split(' ').filter(Boolean);
    return (tokens[0]?.[0] ?? '') + (tokens[1]?.[0] ?? '');
  }

  protected get doctorInitial(): string { return (this.userName || 'D').charAt(0).toUpperCase(); }

  protected getStatusName(status: number | string) {
    if (typeof status === 'string') return status;
    const map: Record<number, string> = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled', 3: 'Completed' };
    return map[status] ?? 'Unknown';
  }

  protected getStatusClass(status: number | string) { return this.getStatusName(status).toLowerCase(); }
}