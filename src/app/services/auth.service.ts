// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LoginUserRequest } from '../models/login-request.model';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { GetPersonalInfoRequest, PersonalInfoRequest } from '../models/personal-info-request.model';
import { resourcePermission } from '../models/api-resp.model';
import { userSessionDetails } from '../models/user-session-responce.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private resourcesAccess: resourcePermission[] = [];

  private apiUrl = 'https://registration.lehriratnasangh.live/api/auth';

  // persistent keys
  private readonly KEY_USER_DETAILS = 'UserDetails';
  private readonly KEY_RESOURCES = 'ResourcesAccess';

  constructor(private http: HttpClient, private router: Router) {}

  // -----------------------------
  // Auth API
  // -----------------------------
  registerUser(formData: FormData): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/createUser`, formData);
  }

  /**
   * Login – backend returns something like:
   * { statusCode, username, message, jwtToken, roleid, userType, resourcePermission? }
   *
   * We save jwtToken + user details persistently (Preferences) so user stays logged in.
   */
  loginUser(model: LoginUserRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/signin`, model).pipe(
      switchMap((res) => from(this.persistLogin(res)).pipe(map(() => res)))
    );
  }

  /**
   * Validate if current token still works by calling a protected endpoint.
   * If backend has a dedicated /me endpoint, use it. Otherwise you can validate by calling
   * getPersonalInfo using stored session.
   */
  restoreSession(): Observable<boolean> {
    return from(this.getLoggedInUserDetailsAsync()).pipe(
      switchMap((user) => {
        if (!user?.jwtToken) return from([false]);

        // Use your existing endpoint to verify token is valid
        return this.getPersonalInfo(user).pipe(
          map(() => true),
          tap({
            error: async () => {
              await this.clearPersistedSession();
            }
          }),
          // convert error -> false
          switchMap((ok) => from([ok]))
        );
      })
    );
  }

  getPersonalInfo(model: userSessionDetails | null | undefined): Observable<GetPersonalInfoRequest> {
    return this.http.post<GetPersonalInfoRequest>(
      `${this.apiUrl}/../iauth/getUserRegistrationInformation`,
      model
    );
  }

  SavePersonalInfo(model: PersonalInfoRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/../iauth/updateUserRegistrationInformation`,
      model
    );
  }

  // -----------------------------
  // Logout
  // -----------------------------
  async logout(): Promise<void> {
    await this.clearPersistedSession();

    // optional: also clear sessionStorage for old code paths
    sessionStorage.clear();

    this.router.navigate(['login']);
  }

  // -----------------------------
  // Auth state helpers
  // -----------------------------
  /**
   * Sync version kept for old code (returns boolean immediately).
   * For mobile persistence, prefer `isAuthenticatedAsync()`.
   */
  isAuthenticated(): boolean {
    const jsonObj = sessionStorage.getItem('UserDetails');
    if (!jsonObj) return false;
    try {
      const parsed = JSON.parse(jsonObj);
      return !!parsed?.jwtToken;
    } catch {
      return false;
    }
  }

  /**
   * New async auth check (reads from Preferences).
   */
  isAuthenticatedAsync(): Promise<boolean> {
    return this.getLoggedInUserDetailsAsync().then((u) => !!u?.jwtToken);
  }

  /**
   * Old method (sessionStorage) kept so existing pages won’t break.
   * Prefer getLoggedInUserDetailsAsync().
   */
  getLoggedInUserDetails(): userSessionDetails | null {
    const jsonObj = sessionStorage.getItem('UserDetails');
    if (!jsonObj) return null;

    try {
      const parsedObj = JSON.parse(jsonObj);
      if (!parsedObj.jwtToken) return null;

      const userDetails: userSessionDetails = {
        roleid: parsedObj.roleid,
        username: parsedObj.username,
        jwtToken: parsedObj.jwtToken,
        userType: parsedObj.userType
      };

      return userDetails;
    } catch (e) {
      console.error('Invalid UserDetails in sessionStorage', e);
      return null;
    }
  }

  /**
   * Preferred: load from persistent storage (Capacitor Preferences).
   * If it exists, also mirrors into sessionStorage so your existing code keeps working.
   */
  async getLoggedInUserDetailsAsync(): Promise<userSessionDetails | null> {
    // 1) Try Preferences (persistent)
    const { value } = await Preferences.get({ key: this.KEY_USER_DETAILS });
    if (!value) return null;

    try {
      const parsedObj = JSON.parse(value);
      if (!parsedObj?.jwtToken) return null;

      // Mirror into sessionStorage for legacy code paths
      sessionStorage.setItem('UserDetails', JSON.stringify(parsedObj));

      const userDetails: userSessionDetails = {
        roleid: parsedObj.roleid,
        username: parsedObj.username,
        jwtToken: parsedObj.jwtToken,
        userType: parsedObj.userType
      };

      return userDetails;
    } catch (e) {
      console.error('Invalid UserDetails in Preferences', e);
      return null;
    }
  }

  /**
   * Resources access list (persistent + legacy mirror).
   */
  async getResourcesAccessAsync(): Promise<resourcePermission[]> {
    const { value } = await Preferences.get({ key: this.KEY_RESOURCES });
    if (!value) return [];

    try {
      const list = JSON.parse(value) as resourcePermission[];
      this.resourcesAccess = list ?? [];
      // Mirror
      sessionStorage.setItem('ResourcesAccess', JSON.stringify(this.resourcesAccess));
      return this.resourcesAccess;
    } catch {
      return [];
    }
  }

  /**
   * Old sync resources access (sessionStorage). Kept for compatibility.
   */
  getResourcesAccess(): resourcePermission[] {
    const jsonObj = sessionStorage.getItem('ResourcesAccess');
    const jsonObj1 = jsonObj ? JSON.parse(jsonObj) : null;
    this.resourcesAccess = Object.assign(this.resourcesAccess, jsonObj1);
    return this.resourcesAccess;
  }

  // -----------------------------
  // Internal persistence helpers
  // -----------------------------
  private async persistLogin(res: any): Promise<void> {
    // Build the exact object your app expects
    const userDetails: any = {
      roleid: res.roleid ?? res?.userSessionDetails?.roleid ?? null,
      username: res.username ?? res?.userSessionDetails?.username ?? null,
      jwtToken: res.jwtToken ?? res.token ?? null,
      userType: res.userType ?? res?.userSessionDetails?.userType ?? null
    };

    // Save persistently
    await Preferences.set({ key: this.KEY_USER_DETAILS, value: JSON.stringify(userDetails) });

    // Save resources permissions if present
    const perms = res.resourcePermission ?? res.resourcesAccess ?? null;
    if (perms) {
      await Preferences.set({ key: this.KEY_RESOURCES, value: JSON.stringify(perms) });
    }

    // Mirror to sessionStorage for existing code
    sessionStorage.setItem('UserDetails', JSON.stringify(userDetails));
    if (perms) sessionStorage.setItem('ResourcesAccess', JSON.stringify(perms));
  }

  private async clearPersistedSession(): Promise<void> {
    await Preferences.remove({ key: this.KEY_USER_DETAILS });
    await Preferences.remove({ key: this.KEY_RESOURCES });
  }
}
