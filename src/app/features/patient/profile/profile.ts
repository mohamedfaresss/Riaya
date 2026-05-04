import { Component, OnInit, DestroyRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap, take, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  form: FormGroup = this.fb.group({ firstName: ['', Validators.required], lastName: ['', Validators.required] });
  loading = true;
  saving = false;
  profileData: any = null;

  ngOnInit() {
    
    this.authService.getAuthState$().pipe(
      filter(state => state.isInitialized),
      take(1),
      switchMap(() => this.http.get<any>(`${environment.apiUrl}/patients/profile`).pipe(catchError(() => EMPTY))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.profileData = data;
        this.form.patchValue({ firstName: data.firstName, lastName: data.lastName });
        this.loading = false;
          this.cdr.detectChanges(); // ← ده الحل

      },
      error: () => { this.loading = false; }
    });
  }

  get avatarInitials(): string {
    const first = this.form.get('firstName')?.value?.charAt(0) || '';
    const last = this.form.get('lastName')?.value?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  get fullName(): string {
    const firstName = this.form.get('firstName')?.value || '';
    const lastName = this.form.get('lastName')?.value || '';
    return `${firstName} ${lastName}`.trim() || 'Patient';
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.http.put(`${environment.apiUrl}/patients/profile`, this.form.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 }); this.saving = false; },
        error: () => { this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 }); this.saving = false; }
      });
  }
}