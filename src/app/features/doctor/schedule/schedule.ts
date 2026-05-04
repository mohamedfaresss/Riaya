import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../../environments/environment';

interface TimeSlot {
  id: string;
  startAtUtc: Date;
  endAtUtc: Date;
  isBooked?: boolean;
  bookingId?: string | null;
}

interface ApiSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface DoctorSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss'
})
export class Schedule implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected loadingSchedules = true;
  protected loadingSlots = true;
  protected savingSchedule = false;
  protected generating = false;

  protected schedules: DoctorSchedule[] = [];
  protected slots: TimeSlot[] = [];

  protected generateOptions = [7, 30];
  protected selectedGenerateDays = 30;
  protected slotFilter: 'all' | 'available' | 'booked' = 'all';
  protected sortBy: 'date' | 'availability' = 'date';
  protected lastGeneratedAt?: Date;

  protected readonly days = [
    { value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' }, { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  protected readonly timeOptions: string[] = (() => {
    const times: string[] = [];
    for (let h = 6; h <= 22; h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
      if (h < 22) times.push(`${String(h).padStart(2, '0')}:30`);
    }
    return times;
  })();

  protected scheduleForm: FormGroup = this.fb.group({
    dayOfWeek: [null, Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    slotDurationMinutes: [30, Validators.required]
  });

  ngOnInit() {
    // Load schedules
    this.http.get<DoctorSchedule[]>(`${environment.apiUrl}/schedules/my`).pipe(
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.schedules = data ?? [];
        this.loadingSchedules = false;
        this.cdr.detectChanges();
      }
    });

    // Load slots
    this.loadSlots();
  }

  // ─── Data Mapping ──────────────────────────────────────────────────────────

  private mapSlot(api: ApiSlot): TimeSlot {
    return {
      id: api.id,
      startAtUtc: new Date(`${api.date}T${api.startTime}`),
      endAtUtc: new Date(`${api.date}T${api.endTime}`),
      isBooked: api.isBooked
    };
  }

  private loadSlots() {
    this.loadingSlots = true;
    this.http.get<ApiSlot[]>(`${environment.apiUrl}/doctors/my-slots`).pipe(
      map(data => (data ?? [])
        .map(s => this.mapSlot(s))
        .sort((a, b) => a.startAtUtc.getTime() - b.startAtUtc.getTime())
      ),
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (slots) => {
        this.slots = slots;
        this.loadingSlots = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Schedule CRUD ─────────────────────────────────────────────────────────

  protected addSchedule() {
    if (this.scheduleForm.invalid) { this.scheduleForm.markAllAsTouched(); return; }
    this.savingSchedule = true;
    const { dayOfWeek, startTime, endTime, slotDurationMinutes } = this.scheduleForm.value;

    this.http.post<DoctorSchedule>(`${environment.apiUrl}/schedules`, {
      dayOfWeek, startTime, endTime, slotDurationMinutes
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (schedule) => {
        this.schedules.push(schedule);
        this.snackBar.open('Schedule added successfully', 'Close', { duration: 2600 });
        this.scheduleForm.reset({ slotDurationMinutes: 30 });
        this.savingSchedule = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.detail || 'Failed to add schedule', 'Close', { duration: 2600 });
        this.savingSchedule = false;
      }
    });
  }

  protected deleteSchedule(id: string) {
    this.http.delete(`${environment.apiUrl}/schedules/${id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.schedules = this.schedules.filter(s => s.id !== id);
          this.snackBar.open('Schedule removed', 'Close', { duration: 2600 });
          this.cdr.detectChanges();
        },
        error: () => this.snackBar.open('Failed to remove schedule', 'Close', { duration: 2600 })
      });
  }

  // ─── Slot Generation & Deletion ────────────────────────────────────────────

  protected generateSlots(rangeDays: number) {
    this.selectedGenerateDays = rangeDays;
    this.generating = true;
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + rangeDays);

    this.http.post<{ generatedCount: number }>(
      `${environment.apiUrl}/schedules/generate-slots`,
      { fromDate: fmt(from), toDate: fmt(to) }
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.lastGeneratedAt = new Date();
        this.snackBar.open(`Generated ${res.generatedCount} slots successfully`, 'Close', { duration: 2600 });
        this.loadSlots();
        this.generating = false;
      },
      error: (err) => {
        this.snackBar.open(err?.error?.detail || 'Failed to generate slots', 'Close', { duration: 2600 });
        this.generating = false;
      }
    });
  }

  protected deleteSlot(id: string) {
    this.http.delete(`${environment.apiUrl}/doctors/slots/${id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.slots = this.slots.filter(s => s.id !== id);
          this.snackBar.open('Slot deleted', 'Close', { duration: 2600 });
          this.cdr.detectChanges();
        },
        error: () => this.snackBar.open('Failed to delete slot', 'Close', { duration: 2600 })
      });
  }

  // ─── Computed Getters ──────────────────────────────────────────────────────

  protected get generateButtonText(): string { return `Generate Next ${this.selectedGenerateDays} Days`; }
  protected get totalSlots(): number { return this.slots.length; }
  protected get availableSlots(): number { return this.slots.filter(s => !s.isBooked && !s.bookingId).length; }
  protected get bookedSlots(): number { return this.slots.filter(s => s.isBooked || !!s.bookingId).length; }

  protected get filteredSlots(): TimeSlot[] {
    return this.slots
      .filter(slot => {
        if (this.slotFilter === 'available') return !slot.isBooked && !slot.bookingId;
        if (this.slotFilter === 'booked') return slot.isBooked || !!slot.bookingId;
        return true;
      })
      .sort((a, b) => {
        if (this.sortBy === 'availability') {
          const aBooked = a.isBooked || !!a.bookingId;
          const bBooked = b.isBooked || !!b.bookingId;
          if (aBooked !== bBooked) return aBooked ? 1 : -1;
        }
        return a.startAtUtc.getTime() - b.startAtUtc.getTime();
      });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  protected formatTime(time: string): string { return time?.substring(0, 5) || ''; }

  protected getDayName(dayOfWeek: number | string): string {
    const n = typeof dayOfWeek === 'string' ? parseInt(dayOfWeek, 10) : dayOfWeek;
    return this.days.find(d => d.value === n)?.label ?? dayOfWeek.toString();
  }

  protected slotStatus(slot: TimeSlot): 'Available' | 'Booked' {
    return slot.isBooked || slot.bookingId ? 'Booked' : 'Available';
  }
}