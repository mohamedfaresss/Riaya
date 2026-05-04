import { Component, OnInit, DestroyRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { BookDialogComponent } from './book-dialog/book-dialog';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './doctors.html',
  styleUrls: ['./doctors.scss']
})
export class Doctors implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  doctors: any[] = [];
  filteredDoctors: any[] = [];
  specializations: any[] = [];
  loading = true;
  currentLang: string = 'en';
  searchText: string = '';
  selectedSpecialization: string = 'All';

  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // ✅ Public endpoint — no auth gating needed
    this.http.get<any[]>(`${environment.apiUrl}/doctors`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.doctors = data;
          this.filteredDoctors = [...data];
          this.applyFilters();
          this.loading = false;
            this.cdr.detectChanges(); // ← ده الحل

        },
        error: () => { this.loading = false; }
      });

    this.http.get<{ value: string; nameEn: string; nameAr: string }[]>(
      `${environment.apiUrl}/doctors/specializations`
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.specializations = data; }
        
      });
  }

  openBookDialog(doctor: any): void {
    this.dialog.open(BookDialogComponent, {
      width: '500px',
      data: { doctor }
    }).afterClosed().subscribe(result => {
      if (result === true) {
        this.snackBar.open('Appointment booked successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredDoctors = this.doctors.filter((doctor) => {
      const matchesSearch = !search || (doctor.fullName || '').toLowerCase().includes(search);
      const doctorSpecialization =
        doctor.specializationValue ??
        doctor.specialization ??
        doctor.specializationName ??
        '';
      const matchesSpecialization =
        this.selectedSpecialization === 'All' ||
        doctorSpecialization === this.selectedSpecialization;

      return matchesSearch && matchesSpecialization;
    });
  }

  onSearchChange(): void { this.applyFilters(); }
  onSpecChange(): void { this.applyFilters(); }

  getDoctorAvatar(name: string | null | undefined): string {
    const safeName = encodeURIComponent(name?.trim() || 'Doctor');
    return `https://ui-avatars.com/api/?name=${safeName}&background=1769e0&color=fff&size=160&bold=true`;
  }

  getConsultationPrice(index: number): number {
    return 200 + (index * 50);
  }
}