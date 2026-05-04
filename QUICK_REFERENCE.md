# Quick Reference - Auth Race Condition Fix

## One-Minute Summary

**Problem**: API calls fail because token isn't loaded yet when components initialize.

**Solution**: Use `DataLoaderService.loadWhenReady()` instead of direct HTTP calls in components.

---

## Before & After Examples

### Example 1: Simple Data Load

```typescript
// ❌ BEFORE (Race condition)
ngOnInit() {
  this.http.get('/api/users').subscribe(users => {
    this.users = users;
  });
}

// ✅ AFTER (Fixed)
ngOnInit() {
  this.dataLoader.loadWhenReady(() =>
    this.http.get('/api/users')
  ).subscribe(users => {
    this.users = users;
  });
}
```

### Example 2: Multiple Requests

```typescript
// ❌ BEFORE
ngOnInit() {
  forkJoin({
    users: this.http.get('/api/users'),
    posts: this.http.get('/api/posts')
  }).subscribe(({ users, posts }) => {...});
}

// ✅ AFTER
ngOnInit() {
  this.dataLoader.loadMultipleWhenReady({
    users: () => this.http.get('/api/users'),
    posts: () => this.http.get('/api/posts')
  }).subscribe(({ users, posts }) => {...});
}
```

### Example 3: With Refresh

```typescript
// ✅ AFTER (With refresh handling)
export class MyComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;

  constructor(
    private http: HttpClient,
    private dataLoader: DataLoaderService,
    private refreshService: BookingRefreshService
  ) {}

  ngOnInit() {
    this.loadData();
    this.subscription = this.refreshService.changes$.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private loadData() {
    this.dataLoader.loadWhenReady(() =>
      this.http.get('/api/my-data')
    ).subscribe(data => {
      this.myData = data;
    });
  }
}
```

---

## Injectable Services Summary

### AuthService - Use Snapshot Methods in Interceptors/Guards Only

```typescript
// ✅ In interceptors/guards only
const token = authService.getTokenSnapshot();
const role = authService.getUserRoleSnapshot();
const isLogged = authService.isLoggedInSnapshot();
```

### DataLoaderService - Use in All Components

```typescript
// ✅ In components
this.dataLoader.loadWhenReady(() =>
  this.http.get('/api/data')
).subscribe(data => {...});
```

### Usage in Constructor

```typescript
constructor(
  private http: HttpClient,
  private dataLoader: DataLoaderService,
  private authService: AuthService
) {}
```

---

## What Changed Under the Hood

1. **APP_INITIALIZER** loads auth state before routing
2. **AuthService** maintains reactive state with BehaviorSubject
3. **DataLoaderService** waits for auth to initialize before executing data loads
4. **HttpInterceptor** safely reads token from initialized state

**Result**: No more race conditions! 🎉

---

## Checklist for Your Components

For each component that loads data:

- [ ] Import `DataLoaderService`
- [ ] Inject it in constructor
- [ ] Wrap API calls with `loadWhenReady()`
- [ ] Add proper error handling
- [ ] Test on fresh page load (verify no 401 errors)

---

## Files Changed

- `src/app/core/services/auth.service.ts` - Added reactive state
- `src/app/core/services/data-loader.service.ts` - NEW SERVICE
- `src/app/core/services/auth.initializer.ts` - NEW INITIALIZER
- `src/app/core/interceptors/jwt.interceptor.ts` - Updated to use snapshot
- `src/app/core/guards/auth.guard.ts` - Updated to use snapshot
- `src/app/app.config.ts` - Added APP_INITIALIZER
- `src/app/features/admin/dashboard/dashboard.ts` - EXAMPLE
- `src/app/features/patient/bookings/bookings.ts` - EXAMPLE

---

## Need Help?

Refer to the detailed guide: `AUTH_RACE_CONDITION_SOLUTION.md`

Pattern examples: Search for "Pattern" in the detailed guide.

