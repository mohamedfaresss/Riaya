import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { BookingRefreshService } from '../../../core/services/booking-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../shared/models/booking.model';

type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
type FilterStatus = 'All' | BookingStatus;

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './bookings.html',
  styleUrl: './bookings.scss'
})
export class Bookings implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bookingRefreshService = inject(BookingRefreshService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly isDoctor: boolean = this.authService.getUserRole() === 'Doctor';
  protected loading = true;
  protected bookings: Booking[] = [];
  protected activeFilter: FilterStatus = 'All';
  protected readonly filters: FilterStatus[] = ['All', 'Pending', 'Confirmed', 'Cancelled'];
  protected pendingCount = 0;
  protected confirmedCount = 0;
  protected cancelledCount = 0;

  ngOnInit() {
    this.fetchBookings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.bookings = data;
          this.calculateCounts();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });

    this.bookingRefreshService.changes$.pipe(
      switchMap(() => this.fetchBookings()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.bookings = data;
        this.calculateCounts();
        this.cdr.detectChanges();
      }
    });
  }

  private fetchBookings() {
    return this.http.get<Booking[]>(`${environment.apiUrl}/bookings/my`).pipe(
      map(data => (data ?? []).sort(
        (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
      )),
      catchError(() => of([]))
    );
  }

  protected setFilter(filter: FilterStatus) { this.activeFilter = filter; }

  protected get filteredBookings(): Booking[] {
    if (this.activeFilter === 'All') return this.bookings;
    return this.bookings.filter(b => this.getStatusName(b.status) === this.activeFilter);
  }

  protected getInitials(name?: string): string {
    const tokens = (name || '').split(' ').filter(Boolean);
    return (tokens[0]?.[0] ?? '') + (tokens[1]?.[0] ?? '');
  }

  protected confirmBooking(id: string) { if (this.isDoctor) this.updateStatus(id, 'Confirmed'); }
  protected completeBooking(id: string) { if (this.isDoctor) this.updateStatus(id, 'Completed'); }

  private updateStatus(id: string, status: BookingStatus) {
    if (!this.isDoctor) return;
    const payload = { newStatus: this.mapStatusToCode(status) };

    this.http.put(`${environment.apiUrl}/bookings/${id}/status`, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(`Appointment ${status.toLowerCase()}.`, 'Close', { duration: 2600 });
          this.bookings = this.bookings.map(b =>
            b.id === id ? { ...b, status: this.mapStatusToCode(status) } : b
          );
          this.calculateCounts();
          this.bookingRefreshService.notifyChanged();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.detail || 'Failed to update appointment.', 'Close', { duration: 2600 });
        }
      });
  }

  private mapStatusToCode(status: BookingStatus): number {
    const map: Record<BookingStatus, number> = { Pending: 0, Confirmed: 1, Cancelled: 2, Completed: 3 };
    return map[status];
  }

  protected getStatusName(status: number | string) {
    if (typeof status === 'string') return status;
    const map: Record<number, string> = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled', 3: 'Completed' };
    return map[status] ?? 'Unknown';
  }

  protected getStatusClass(status: number | string) { return this.getStatusName(status).toLowerCase(); }

  private calculateCounts() {
    this.pendingCount = this.bookings.filter(b => this.getStatusName(b.status) === 'Pending').length;
    this.confirmedCount = this.bookings.filter(b => this.getStatusName(b.status) === 'Confirmed').length;
    this.cancelledCount = this.bookings.filter(b => this.getStatusName(b.status) === 'Cancelled').length;
  }
}