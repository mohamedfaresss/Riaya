import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, finalize, map } from 'rxjs/operators';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenPayload
} from '../../shared/models/auth.models';
import { environment } from '../../../environments/environment';

export interface AuthState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: TokenPayload | null;
}

const initialAuthState: AuthState = {
  isInitialized: false,
  isAuthenticated: false,
  token: null,
  user: null,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly roleClaim =
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
  private readonly emailClaim =
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
  private readonly nameIdentifierClaim =
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

  private authState$ = new BehaviorSubject<AuthState>(initialAuthState);

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuthState();
  }

  // ─── Observable Streams ────────────────────────────────────────────────────

  getAuthState$(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  isAuthInitialized$(): Observable<boolean> {
    return this.authState$.pipe(map(s => s.isInitialized));
  }

  getToken$(): Observable<string | null> {
    return this.authState$.pipe(map(s => s.token));
  }

  isLoggedIn$(): Observable<boolean> {
    return this.authState$.pipe(map(s => s.isAuthenticated));
  }

  getUser$(): Observable<TokenPayload | null> {
    return this.authState$.pipe(map(s => s.user));
  }

  // ─── Synchronous Snapshots (guards / interceptors only) ───────────────────

  getAuthStateSnapshot(): AuthState {
    return this.authState$.getValue();
  }

  getTokenSnapshot(): string | null {
    return this.authState$.getValue().token;
  }

  isLoggedInSnapshot(): boolean {
    return this.authState$.getValue().isAuthenticated;
  }

  getUserRoleSnapshot(): string | null {
    return this.authState$.getValue().user?.role ?? null;
  }

  getUserIdSnapshot(): string | null {
    return this.authState$.getValue().user?.userId ?? null;
  }

  getUserNameSnapshot(): string {
    return this.authState$.getValue().user?.name || 'Patient';
  }

  getUserFirstName(): string {
    return this.getUserNameSnapshot().split(' ')[0];
  }

  // Backward-compatible aliases
  getRole(): string | null { return this.getUserRoleSnapshot(); }
  getUserRole(): string | null { return this.getUserRoleSnapshot(); }
  getUserName(): string { return this.getUserNameSnapshot(); }

  // ─── Auth Actions ──────────────────────────────────────────────────────────

  private initializeAuthState(): void {
    const token = localStorage.getItem('token');
    const user = token ? this.decodeToken(token) : null;

    this.authState$.next({
      isInitialized: true,
      isAuthenticated: !!token && !!user,
      token,
      user,
    });
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, request)
      .pipe(
        tap(res => this.setTokens(res)),
        finalize(() => this.syncStateFromStorage())
      );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register/patient`, request)
      .pipe(
        tap(res => this.setTokens(res)),
        finalize(() => this.syncStateFromStorage())
      );
  }

  logout(): void {
    this.clearTokens();
    // ✅ isInitialized stays true — auth is ready, user is just logged out
    this.authState$.next({
      isInitialized: true,
      isAuthenticated: false,
      token: null,
      user: null,
    });
    this.router.navigate(['/auth/login']);
  }

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private syncStateFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = token ? this.decodeToken(token) : null;
    this.authState$.next({
      isInitialized: true,
      isAuthenticated: !!token && !!user,
      token,
      user,
    });
  }

  private setTokens(res: AuthResponse): void {
    localStorage.setItem('token', res.token);
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const encodedPayload = token.split('.')[1];
      if (!encodedPayload) return null;

      const decoded = JSON.parse(this.decodeBase64Url(encodedPayload));
      const role = this.normalizeRole(decoded[this.roleClaim]);

      return {
        userId: decoded[this.nameIdentifierClaim] || decoded['id'] || '',
        email: decoded[this.emailClaim] || '',
        role,
        clinicId: decoded['clinicId'] || '',
        name: decoded['name'] || '',
      };
    } catch {
      return null;
    }
  }

  private decodeBase64Url(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '='
    );
    return atob(padded);
  }

  private normalizeRole(role: unknown): string {
    const normalized = String(role || '').trim().toLowerCase();
    if (!normalized) return '';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}