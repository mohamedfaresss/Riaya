import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-add-doctor-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './add-doctor-page.html',
  styleUrl: './add-doctor-page.scss'
})
export class AddDoctorPage {
  protected submitting = false;
  protected readonly form;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.http.post(`${environment.apiUrl}/auth/register/doctor`, this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Doctor added successfully.', 'Close', { duration: 2600 });
        this.router.navigate(['/admin/doctors']);
      },
      error: (error) => {
        this.submitting = false;
        this.snackBar.open(error?.error?.detail || 'Failed to add doctor.', 'Close', {
          duration: 2600
        });
      }
    });
  }

  protected cancel() {
    this.router.navigate(['/admin/doctors']);
  }
}
