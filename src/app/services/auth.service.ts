import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiResponse } from '../models/ApiResponse';
import { AuthenticationResponse } from '../models/auth/authentication/AuthenticationResponse';
import { LoginRequest } from '../models/auth/authentication/LoginRequest';
import { AccessProfile } from '../models/auth/authentication/AccessProfile';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';
const ACCESS_PROFILE_KEY = 'auth.accessProfile';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/v1/auth';

  private readonly accessTokenSignal = signal<string | null>(localStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly refreshTokenSignal = signal<string | null>(localStorage.getItem(REFRESH_TOKEN_KEY));
  private readonly accessProfileSignal = signal<AccessProfile | null>(this.readAccessProfile());

  readonly accessToken = computed(() => this.accessTokenSignal());
  readonly refreshToken = computed(() => this.refreshTokenSignal());
  readonly accessProfile = computed(() => this.accessProfileSignal());
  readonly isAuthenticated = computed(() => !!this.accessTokenSignal());

  login(request: LoginRequest): Observable<ApiResponse<AuthenticationResponse>> {
    return this.http.post<ApiResponse<unknown> | unknown>(`${this.baseUrl}/login`, request).pipe(
      map((response) => this.normalizeAuthApiResponse(response)),
      tap((response) => {
        if (response.data.accessToken) {
          this.persistSession(response.data);
        }
      })
    );
  }

  persistSession(session: AuthenticationResponse): void {
    this.accessTokenSignal.set(session.accessToken);
    this.refreshTokenSignal.set(session.refreshToken);
    this.accessProfileSignal.set(session.accessProfile);

    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(ACCESS_PROFILE_KEY, JSON.stringify(session.accessProfile));
  }

  clearSession(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.accessProfileSignal.set(null);

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_PROFILE_KEY);
  }

  private readAccessProfile(): AccessProfile | null {
    const raw = localStorage.getItem(ACCESS_PROFILE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AccessProfile;
    } catch {
      localStorage.removeItem(ACCESS_PROFILE_KEY);
      return null;
    }
  }

  private normalizeAuthApiResponse(raw: ApiResponse<unknown> | unknown): ApiResponse<AuthenticationResponse> {
    const record = (raw ?? {}) as Record<string, unknown>;
    const dataNode = this.toRecord(record['data']) ?? record;

    const tokenNode = this.toRecord(dataNode['tokens']);

    const accessToken = this.pickString(
      dataNode['accessToken'],
      dataNode['access_token'],
      dataNode['token'],
      dataNode['jwt'],
      tokenNode?.['accessToken'],
      tokenNode?.['access_token'],
      tokenNode?.['token']
    );

    const refreshToken = this.pickString(
      dataNode['refreshToken'],
      dataNode['refresh_token'],
      tokenNode?.['refreshToken'],
      tokenNode?.['refresh_token']
    );

    const tokenType = this.pickString(dataNode['tokenType'], dataNode['token_type']) || 'Bearer';

    const accessProfile = this.extractAccessProfile(dataNode);

    return {
      success: Boolean(record['success'] ?? true),
      message: String(record['message'] ?? ''),
      timestamp: String(record['timestamp'] ?? ''),
      data: {
        accessToken,
        refreshToken,
        tokenType,
        accessProfile
      }
    };
  }

  private extractAccessProfile(dataNode: Record<string, unknown>): AccessProfile {
    const profileNode =
      this.toRecord(dataNode['accessProfile']) ||
      this.toRecord(dataNode['access_profile']) ||
      this.toRecord(dataNode['profile']) ||
      {};

    const username = this.pickString(profileNode['username'], dataNode['username']) || '';
    const userId = this.pickNumber(profileNode['userId'], profileNode['id'], dataNode['userId'], dataNode['id']) || 0;

    return {
      userId,
      username,
      roles: this.toStringArray(profileNode['roles']),
      permissions: this.toStringArray(profileNode['permissions']),
      menus: (profileNode['menus'] as AccessProfile['menus']) || [],
      permissionDetails: (profileNode['permissionDetails'] as AccessProfile['permissionDetails']) || []
    };
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private pickString(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  }

  private pickNumber(...values: unknown[]): number | null {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
        return Number(value);
      }
    }
    return null;
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item) => typeof item === 'string')
      .map((item) => (item as string).trim())
      .filter(Boolean);
  }
}
