import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Adjust path

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://192.168.1.46:8080/api/admin';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const userDetails = this.authService.getLoggedInUserDetails();
    const token = userDetails?.jwtToken || '';
    if (!token) {
      console.warn('No JWT token available, proceeding without authorization'); // Log warning instead of throwing
      return new HttpHeaders().set('Content-Type', 'application/json');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`).set('Content-Type', 'application/json');
  }

  createEvent(eventData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/createEvent`, eventData, { headers: this.getHeaders() });
  }

  getRegisteredFamilies(eventId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/${eventId}/families`, { headers: this.getHeaders() });
  }

  selectFamilies(eventId: number, userIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/select-families`, { userIds }, { headers: this.getHeaders() });
  }

  deleteUnselectedFamilies(eventId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}/unselected-families`, { headers: this.getHeaders() });
  }

  confirmFamilies(eventId: number, userIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/events/${eventId}/confirm-families`, { userIds }, { headers: this.getHeaders() });
  }

  getConfirmedFamilies(eventId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/events/${eventId}/confirmed-families`, { headers: this.getHeaders() });
  }
}