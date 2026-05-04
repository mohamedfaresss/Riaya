import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { environment } from '../../../../environments/environment';

type Specialization = { value: string; nameEn: string };

interface DoctorProfile {
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  university: string;
  experience: string;
  imageUrl: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatSnackBarModule, MatSelectModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected loading = true;
  protected saving = false;
  protected specializations: Specialization[] = [];
  protected form: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [''],
    specialization: [''],
    university: [''],
    yearsOfExperience: [0, [Validators.min(0), Validators.max(60)]]
  });

  ngOnInit() {
    forkJoin({
      profile: this.http.get<DoctorProfile>(`${environment.apiUrl}/doctors/profile`)
        .pipe(catchError(() => of(null))),
      specializations: this.http.get<Specialization[]>(`${environment.apiUrl}/doctors/specializations`)
        .pipe(catchError(() => of([])))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ profile, specializations }) => {
          this.specializations = specializations.filter(s => s.value !== 'All');
          if (profile) {
            this.form.patchValue({
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              email: profile.email || '',
              specialization: profile.specialty || '',
              university: profile.university || '',
              yearsOfExperience: parseInt(profile.experience || '0', 10)
            });
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
  }

  protected save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const formData = new FormData();
    formData.append('firstName', this.form.get('firstName')?.value || '');
    formData.append('lastName', this.form.get('lastName')?.value || '');
    formData.append('Specialty', this.form.get('specialization')?.value || '');
    formData.append('university', this.form.get('university')?.value || '');
    formData.append('YearsOfExperience', String(this.form.get('yearsOfExperience')?.value ?? 0));
    formData.append('Experience', String(this.form.get('yearsOfExperience')?.value ?? 0));

    this.http.put(`${environment.apiUrl}/doctors/profile`, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Profile updated successfully.', 'Close', { duration: 2600 });
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackBar.open('Failed to update profile.', 'Close', { duration: 2600 });
          this.saving = false;
          this.cdr.detectChanges();
        }
      });
  }

  protected get initials() {
    const first = this.form.get('firstName')?.value?.trim()?.[0] ?? '';
    const last = this.form.get('lastName')?.value?.trim()?.[0] ?? '';
    return `${first}${last}`.toUpperCase() || 'DR';
  }
}