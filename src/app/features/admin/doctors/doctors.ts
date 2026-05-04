import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface UserResponse {
  items: AdminUser[];
  totalCount: number;
}

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './doctors.html',
  styleUrl: './doctors.scss'
})
export class Doctors implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected loading = true;
  protected doctors: AdminUser[] = [];

  ngOnInit() {
    this.fetchDoctors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.doctors = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
  }

  private fetchDoctors() {
    const params = new HttpParams().set('page', 1).set('pageSize', 300);
    return this.http.get<UserResponse>(`${environment.apiUrl}/admin/users`, { params }).pipe(
      map(response => response.items
        .filter(u => (u.role || '').toLowerCase() === 'doctor')
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
      ),
      catchError(() => of([]))
    );
  }

  protected getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }

  protected deleteDoctor(id: string) {
    if (!confirm('Delete this doctor account?')) return;

    this.http.delete(`${environment.apiUrl}/admin/users/${id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Doctor account deleted.', 'Close', { duration: 2600 });
          this.fetchDoctors().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data) => { this.doctors = data; this.cdr.detectChanges(); }
          });
        },
        error: (err) => {
          this.snackBar.open(err?.error?.detail || 'Failed to delete doctor.', 'Close', { duration: 2600 });
        }
      });
  }
}