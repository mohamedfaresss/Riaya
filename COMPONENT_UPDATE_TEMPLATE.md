# Component Update Template

Use this template to update all remaining components that load data.

## Template for Data-Loading Components

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { DataLoaderService } from '../../../core/services/data-loader.service';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [/* your imports */],
  templateUrl: './my-component.html',
  styleUrl: './my-component.scss'
})
export class MyComponent implements OnInit, OnDestroy {
  // State
  data: any = null;
  loading = true;
  error: string | null = null;

  // Subscriptions (always clean up!)
  private dataSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private dataLoader: DataLoaderService
  ) {}

  ngOnInit() {
    // ✅ Load data AFTER auth is initialized
    this.loadData();
  }

  ngOnDestroy() {
    // ✅ Always unsubscribe to prevent memory leaks
    this.dataSubscription?.unsubscribe();
  }

  private loadData() {
    this.loading = true;
    this.error = null;

    // ✅ Use DataLoaderService - waits for auth to be ready
    this.dataSubscription = this.dataLoader.loadWhenReady(() =>
      this.http.get('/api/my-endpoint')
    ).subscribe({
      next: (result) => {
        this.data = result;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.error = 'Failed to load data. Please try again.';
        this.loading = false;
      }
    });
  }
}
```

## Template for Multi-Request Components

```typescript
export class MyComponent implements OnInit, OnDestroy {
  stats: any = null;
  bookings: any[] = [];
  loading = true;
  error: string | null = null;

  private dataSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private dataLoader: DataLoaderService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
  }

  private loadData() {
    this.loading = true;
    this.error = null;

    // ✅ Load multiple requests in parallel
    this.dataSubscription = this.dataLoader.loadMultipleWhenReady({
      stats: () => this.http.get('/api/stats'),
      bookings: () => this.http.get('/api/bookings')
    }).subscribe({
      next: ({ stats, bookings }) => {
        this.stats = stats;
        this.bookings = bookings;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.error = 'Failed to load data. Please try again.';
        this.loading = false;
      }
    });
  }
}
```

## Template with Refresh Service

```typescript
export class MyComponent implements OnInit, OnDestroy {
  data: any = null;
  loading = true;

  private dataSubscription?: Subscription;
  private refreshSubscription?: Subscription;

  constructor(
    private http: HttpClient,
    private dataLoader: DataLoaderService,
    private refreshService: BookingRefreshService // or your refresh service
  ) {}

  ngOnInit() {
    // Initial load
    this.loadData();

    // Subscribe to refresh events
    this.refreshSubscription = this.refreshService.changes$.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.dataSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();
  }

  private loadData() {
    this.loading = true;

    this.dataSubscription = this.dataLoader.loadWhenReady(() =>
      this.http.get('/api/my-data')
    ).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.loading = false;
      }
    });
  }
}
```

## Components to Update

### High Priority

1. **`features/admin/bookings/bookings.ts`** ⬅️ Similar to patient bookings
2. **`features/admin/doctors/doctors.ts`** ⬅️ Likely lists doctors
3. **`features/admin/patients/patients.ts`** ⬅️ Likely lists patients
4. **`features/doctor/dashboard/dashboard.ts`** ⬅️ Similar to admin dashboard
5. **`features/doctor/bookings/bookings.ts`** ⬅️ Similar to patient bookings
6. **`features/doctor/schedule/schedule.ts`** ⬅️ Loads schedule data

### Medium Priority

7. **`features/patient/dashboard/dashboard.ts`** ⬅️ Loads patient dashboard
8. **`features/patient/doctors/doctors.ts`** ⬅️ Lists available doctors

### Low Priority (Profile pages)

9. **`features/admin/profile/profile.ts`** ⬅️ Load admin profile
10. **`features/doctor/profile/profile.ts`** ⬅️ Load doctor profile
11. **`features/patient/profile/profile.ts`** ⬅️ Load patient profile

## Step-by-Step Update Process

For each component:

1. Open the component file
2. Add `DataLoaderService` to imports:
   ```typescript
   import { DataLoaderService } from '../../../core/services/data-loader.service';
   ```

3. Inject in constructor:
   ```typescript
   constructor(
     private http: HttpClient,
     private dataLoader: DataLoaderService
   ) {}
   ```

4. Wrap ngOnInit data loading:
   ```typescript
   // Replace direct:
   this.http.get('/api/...').subscribe(...)
   
   // With:
   this.dataLoader.loadWhenReady(() =>
     this.http.get('/api/...')
   ).subscribe(...)
   ```

5. Add unsubscribe in ngOnDestroy
6. Test on fresh page load
7. Move to next component

## Testing Each Component

After updating each component:

1. Clear browser cache or use Incognito mode
2. Log in to the app
3. Navigate directly to that component's page
4. Verify data loads WITHOUT manual refresh
5. Check Network tab for no 401 errors
6. Verify no console errors

## Common Patterns

### Pattern: Sequential Requests

```typescript
private loadData() {
  this.dataLoader.loadWhenReady(() =>
    this.http.get('/api/user').pipe(
      switchMap(user => {
        // Use user data for next request
        return this.http.get(`/api/user/${user.id}/profile`);
      })
    )
  ).subscribe(...);
}
```

### Pattern: With Loading State

```typescript
private loadData() {
  this.loading = true;
  this.dataLoader.loadWhenReady(() =>
    this.http.get('/api/data')
  ).pipe(
    tap(data => console.log('Data loaded:', data)),
    finalize(() => this.loading = false)
  ).subscribe({
    next: (data) => this.data = data,
    error: (err) => console.error(err)
  });
}
```

### Pattern: With Error State

```typescript
private loadData() {
  this.loading = true;
  this.error = null;

  this.dataLoader.loadWhenReady(() =>
    this.http.get('/api/data')
  ).subscribe({
    next: (data) => {
      this.data = data;
      this.loading = false;
      this.error = null;
    },
    error: (err) => {
      console.error('Load failed:', err);
      this.error = 'Could not load data. Please try again.';
      this.loading = false;
    }
  });
}
```

## Import Statements Needed

```typescript
// Standard imports
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { switchMap, tap, finalize } from 'rxjs/operators';

// New service import
import { DataLoaderService } from '../../../core/services/data-loader.service';

// Optional: your refresh service
import { BookingRefreshService } from '../../../core/services/booking-refresh.service';

// Optional: auth service (if you need auth info)
import { AuthService } from '../../../core/services/auth.service';
```

---

**Total Changes Needed**: Update ~11 components with the pattern above.

**Estimated Time**: 5-10 minutes per component

**Total Time**: 1-2 hours to update entire app

