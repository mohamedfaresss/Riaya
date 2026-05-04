import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './patients.html',
  styleUrl: './patients.scss'
})
export class Patients implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected loading = true;
  protected patients: AdminUser[] = [];

  ngOnInit() {
    this.fetchPatients()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.patients = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
  }

  private fetchPatients() {
    const params = new HttpParams().set('page', 1).set('pageSize', 400);
    return this.http.get<UserResponse>(`${environment.apiUrl}/admin/users`, { params }).pipe(
      map(response => response.items
        .filter(u => (u.role || '').toLowerCase() === 'patient')
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
      ),
      catchError(() => of([]))
    );
  }

  protected getInitials(firstName: string, lastName: string): string {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }
}