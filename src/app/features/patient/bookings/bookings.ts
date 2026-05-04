import { Component, OnInit, TemplateRef, ViewChild, DestroyRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BookingRefreshService } from '../../../core/services/booking-refresh.service';
import { AuthService } from '../../../core/services/auth.service';
import { Booking } from '../../../shared/models/booking.model';

interface DoctorBookingGroup {
  key: string;
  doctorName: string;
  specialization: string;
  fallbackLabel: string;
  avatarInitial: string;
  bookings: Booking[];
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    RouterLink
  ],
  templateUrl: './bookings.html',
  styleUrl: './bookings.scss'
})
export class Bookings implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bookingRefreshService = inject(BookingRefreshService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  allBookings: Booking[] = [];
  loading = true;
  filter = 'All';
  filters = ['All', 'Pending', 'Confirmed', 'Cancelled'];
  pendingCount = 0;
  confirmedCount = 0;
  cancelledCount = 0;
  expandedDoctors = new Set<string>();
  selectedBooking: Booking | null = null;

  @ViewChild('bookingDetailsDialog', { static: true }) bookingDetailsDialog!: TemplateRef<any>;

  ngOnInit() {
    this.authService.getAuthState$().pipe(
      filter(state => state.isInitialized),
      take(1),
      switchMap(() => this.fetchBookings()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.allBookings = data ?? [];
        this.calculateCounts();
        this.loading = false;
          this.cdr.detectChanges(); // ← ده الحل

      },
      error: () => { this.loading = false; }
    });

    this.bookingRefreshService.changes$.pipe(
      switchMap(() => this.fetchBookings()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.allBookings = data ?? [];
        this.calculateCounts();
      }
    });
  }

  private fetchBookings() {
    return this.http.get<Booking[]>(`${environment.apiUrl}/bookings/my`)
      .pipe(catchError(() => EMPTY));
  }

  private calculateCounts() {
    this.pendingCount = this.allBookings.filter(b => this.getStatusName(b.status) === 'Pending').length;
    this.confirmedCount = this.allBookings.filter(b => this.getStatusName(b.status) === 'Confirmed').length;
    this.cancelledCount = this.allBookings.filter(b => this.getStatusName(b.status) === 'Cancelled').length;
  }

  private getDoctorGroupKey(booking: Booking, doctorName: string, specialization: string) {
    return [doctorName.toLowerCase(), specialization.toLowerCase(), booking.doctorImage || ''].join('|');
  }

  get filteredBookings() {
    if (this.filter === 'All') return this.allBookings;
    return this.allBookings.filter(b => this.getStatusName(b.status) === this.filter);
  }

  get groupedBookings(): DoctorBookingGroup[] {
    const groups = new Map<string, DoctorBookingGroup>();
    for (const booking of this.filteredBookings) {
      const doctorName = (booking.doctorName || 'Doctor').trim();
      const specialization = this.getDoctorSpecialization(booking);
      const fallbackLabel = booking.reason || 'General consultation';
      const key = this.getDoctorGroupKey(booking, doctorName, specialization);
      const existingGroup = groups.get(key);
      if (existingGroup) { existingGroup.bookings.push(booking); continue; }
      groups.set(key, {
        key, doctorName, specialization, fallbackLabel,
        avatarInitial: doctorName.charAt(0).toUpperCase() || 'D',
        bookings: [booking]
      });
    }
    return Array.from(groups.values()).map(group => ({
      ...group,
      bookings: [...group.bookings].sort(
        (a, b) => new Date(a.startAtUtc).getTime() - new Date(b.startAtUtc).getTime()
      )
    }));
  }

  setFilter(f: string) { this.filter = f; }
  toggleDoctorGroup(groupKey: string) {
    if (this.expandedDoctors.has(groupKey)) this.expandedDoctors.delete(groupKey);
    else this.expandedDoctors.add(groupKey);
  }
  isDoctorGroupExpanded(groupKey: string) { return this.expandedDoctors.has(groupKey); }
  getVisibleBookings(group: DoctorBookingGroup) {
    if (this.isDoctorGroupExpanded(group.key) || group.bookings.length <= 2) return group.bookings;
    return group.bookings.slice(0, 2);
  }
  openBookingDetails(booking: Booking) {
    this.selectedBooking = booking;
    this.dialog.open(this.bookingDetailsDialog, {
      width: '440px', panelClass: 'booking-dialog-panel', backdropClass: 'booking-dialog-backdrop'
    }).afterClosed().subscribe(() => { this.selectedBooking = null; });
  }
  cancelSelectedBooking() { if (this.selectedBooking) this.cancelBooking(this.selectedBooking.id); }
  canCancelBooking(booking: Booking | null) {
    if (!booking) return false;
    const s = this.getStatusName(booking.status);
    return s === 'Pending' || s === 'Confirmed';
  }
  getFilterCount(f: string) {
    if (f === 'All') return this.allBookings.length;
    if (f === 'Pending') return this.pendingCount;
    if (f === 'Confirmed') return this.confirmedCount;
    if (f === 'Cancelled') return this.cancelledCount;
    return 0;
  }
  getEmptyTitle() { return this.filter === 'All' ? 'No bookings yet' : `No ${this.filter.toLowerCase()} bookings`; }
  getEmptySubtitle() {
    return this.filter === 'All' ? 'Book your first appointment to get started.' : 'Try another tab or check back again later.';
  }
  getStatusName(status: number | string) {
    if (typeof status === 'string') return status;
    const map: Record<number, string> = { 0: 'Pending', 1: 'Confirmed', 2: 'Cancelled', 3: 'Completed' };
    return map[status] ?? 'Unknown';
  }
  getStatusLabel(status: number | string) { const s = this.getStatusName(status); return s === 'Pending' ? 'Waiting' : s; }
  getStatusClass(status: number | string) { return this.getStatusName(status).toLowerCase(); }
  getDoctorSpecialization(booking: any) {
    return booking.specialization || booking.doctorSpecialization || booking.specializationName || '';
  }
  cancelBooking(id: string) {
    if (this.authService.getUserRole() !== 'Patient') return;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    this.http.delete(`${environment.apiUrl}/bookings/${id}`).subscribe({
      next: () => {
        this.snackBar.open('Booking cancelled', 'Close', { duration: 3000 });
        this.bookingRefreshService.notifyChanged();
        this.allBookings = this.allBookings.map(b => b.id === id ? { ...b, status: 2 } : b);
        this.calculateCounts();
      },
      error: (err) => { this.snackBar.open(err?.error?.detail || 'Failed to cancel', 'Close', { duration: 3000 }); }
    });
  }
}