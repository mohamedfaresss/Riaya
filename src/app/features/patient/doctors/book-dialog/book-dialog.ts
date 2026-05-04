import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { BookingRefreshService } from '../../../../core/services/booking-refresh.service';

@Component({
  selector: 'app-book-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './book-dialog.html',
  styleUrl: './book-dialog.scss'
})
export class BookDialogComponent implements OnInit {
  slots: any[] = [];
  dayGroups: Array<{ key: string; date: Date; slots: any[] }> = [];
  selectedDayKey = '';
  form: FormGroup;
  loading = true;
  submitting = false;
  success = false;
  error = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BookDialogComponent>,
    private cdr: ChangeDetectorRef,
    private bookingRefreshService: BookingRefreshService,
    @Inject(MAT_DIALOG_DATA) public data: { doctor: any }
  ) {
    this.form = this.fb.group({
      timeSlotId: ['', Validators.required],
      reason: ['']
    });
  }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/timeslots?doctorId=${this.data.doctor.id}`).subscribe({
      next: (data) => {
        this.slots = data ?? [];
        this.dayGroups = this.groupSlotsByDay(this.slots);
        this.selectedDayKey = this.dayGroups[0]?.key ?? '';
        this.syncSelectedSlot();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    this.error = '';

    const payload = {
      doctorId: this.data.doctor.id,
      timeSlotId: this.form.value.timeSlotId,
      reason: this.form.value.reason || ''
    };

    this.http.post(`${environment.apiUrl}/bookings`, payload).subscribe({
      next: () => {
        this.bookingRefreshService.notifyChanged();
        this.success = true;
        this.submitting = false;
        this.cdr.detectChanges();
        setTimeout(() => this.dialogRef.close(true), 1500);
      },
      error: (err) => {
        this.error = err?.error?.detail || err?.error?.message || 'Booking failed. Please try again.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectDay(dayKey: string) {
    if (this.selectedDayKey === dayKey) return;
    this.selectedDayKey = dayKey;
    this.syncSelectedSlot();
  }

  selectTimeSlot(slotId: string) {
    this.form.patchValue({ timeSlotId: slotId });
    this.form.get('timeSlotId')?.markAsTouched();
  }

  getSelectedDaySlots() {
    return this.dayGroups.find((group) => group.key === this.selectedDayKey)?.slots ?? [];
  }

  getSelectedDayLabel() {
    const selectedDay = this.dayGroups.find((group) => group.key === this.selectedDayKey);
    return selectedDay ? this.formatDayLabel(selectedDay.date) : '';
  }

  formatDayName(dateInput: string | Date) {
    return new Date(dateInput).toLocaleDateString('en-US', { weekday: 'short' });
  }

  formatDayDate(dateInput: string | Date) {
    return new Date(dateInput).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDayLabel(dateInput: string | Date) {
    return new Date(dateInput).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  private groupSlotsByDay(slots: any[]) {
    const grouped = new Map<string, { key: string; date: Date; slots: any[] }>();

    for (const slot of slots) {
      const slotDate = new Date(slot.startAtUtc);
      const dayKey = slotDate.toISOString().slice(0, 10);

      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, {
          key: dayKey,
          date: slotDate,
          slots: []
        });
      }

      grouped.get(dayKey)!.slots.push(slot);
    }

    return Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private syncSelectedSlot() {
    const currentSlotId = this.form.value.timeSlotId;
    const selectedDaySlots = this.getSelectedDaySlots();
    const hasCurrentSlot = selectedDaySlots.some((slot) => slot.id === currentSlotId);

    this.form.patchValue({
      timeSlotId: hasCurrentSlot ? currentSlotId : ''
    });
  }
}
