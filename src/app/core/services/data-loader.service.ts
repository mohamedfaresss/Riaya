import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, combineLatest, of } from 'rxjs';
import { switchMap, filter, take } from 'rxjs/operators';

/**
 * Service to safely load data AFTER auth is initialized.
 * 
 * This ensures components wait until:
 * 1. Auth state is initialized (token loaded from localStorage)
 * 2. The component has access to auth information
 * 
 * Usage in components:
 * ```ts
 * constructor(private dataLoader: DataLoaderService, private http: HttpClient) {}
 * 
 * ngOnInit() {
 *   this.dataLoader.loadWhenReady(() => 
 *     this.http.get('/api/data')
 *   ).subscribe(data => this.data = data);
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DataLoaderService {
  private auth = inject(AuthService);

  /**
   * Execute a data-loading function only after auth is initialized.
   * Prevents the race condition where API calls happen before the token is available.
   * 
   * @param loadFn - Function that returns an Observable of data
   * @returns Observable that emits data after auth is ready
   */
  loadWhenReady<T>(loadFn: () => Observable<T>): Observable<T> {
    return this.auth.getAuthState$().pipe(
      // Wait until auth is initialized
      filter(state => state.isInitialized),
      // Take only the first emission (when initialized)
      take(1),
      // Now execute the data loading function
      switchMap(() => loadFn())
    );
  }

  /**
   * Execute multiple data-loading functions in parallel after auth is initialized.
   * 
   * Usage:
   * ```ts
   * this.dataLoader.loadMultipleWhenReady({
   *   users: () => this.http.get('/api/users'),
   *   posts: () => this.http.get('/api/posts')
   * }).subscribe(result => {
   *   this.users = result.users;
   *   this.posts = result.posts;
   * });
   * ```
   */
  loadMultipleWhenReady<T extends Record<string, () => Observable<any>>>(
    loaders: T
  ): Observable<{ [K in keyof T]: any }> {
    return this.auth.getAuthState$().pipe(
      filter(state => state.isInitialized),
      take(1),
      switchMap(() => {
        const observables: Record<string, Observable<any>> = {};
        for (const [key, fn] of Object.entries(loaders)) {
          observables[key] = fn();
        }
        return combineLatest(observables).pipe(
          switchMap(results => {
            const combined: any = {};
            for (const [key, result] of Object.entries(results)) {
              combined[key] = result;
            }
            return of(combined);
          })
        );
      })
    );
  }

  /**
   * Get the current auth state synchronously (use with caution).
   * Safe to use ONLY after you've confirmed auth is initialized.
   */
  getAuthSnapshot() {
    return this.auth.getAuthStateSnapshot();
  }
}
