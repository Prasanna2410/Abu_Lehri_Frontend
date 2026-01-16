import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { userSessionDetails } from 'src/app/models/user-session-responce.model';
import { AuthService } from 'src/app/services/auth.service';
import { FormsModule } from '@angular/forms';

interface UserRegistration {
  userid: number;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  city: string;
  mobileNumber: string;
  email: string;
  userType: number;
  eventId?: number;
  noOfMembers?: number;
  isSelected?: boolean;
}

interface FamilyResponseDTO {
  head?: UserRegistration;
  members?: UserRegistration[];
}

interface FamilyListResponse {
  status: string;
  families: FamilyResponseDTO[];
  message: string;
}

interface MessageResponse {
  message: string;
  status: string;
}

interface CreateEventRequest {
  eventName: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
}

interface SelectFamiliesRequest {
  userIds: number[];
}

interface Event {
  id: number;
  eventName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  capacity?: number;
}

interface EventFamiliesGroup {
  event: Event;
  families: any[];
}

@Component({
  selector: 'app-user-account-list',
  templateUrl: './user-account-list.component.html',
  styleUrls: ['./user-account-list.component.css']
})
export class UserAccountListComponent implements OnInit, OnDestroy {
  private baseUrl = 'https://192.168.1.46:8080/api/admin';
  private tokenSubscription?: Subscription;
  userSessionDetails: userSessionDetails | null | undefined;
  allRegisteredFamilies: EventFamiliesGroup[] = [];
  allConfirmedFamilies: EventFamiliesGroup[] = [];
  selectedFamilyIds: boolean[] = [];
  message: string = '';
  status: string = '';
  createEventMessage: string = '';
  createEventStatus: string = '';
  createEventRequest: CreateEventRequest = {
    eventName: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    capacity: 0
  };

  constructor(private http: HttpClient, private AuthService: AuthService) {}

  ngOnInit(): void {
    this.userSessionDetails = this.AuthService.getLoggedInUserDetails();
    if (this.userSessionDetails) {
      this.fetchAllEventsAndFamilies();
    }
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.userSessionDetails?.jwtToken;
    if (!token) {
      throw new Error('No JWT token available');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private async fetchAllEventsAndFamilies(): Promise<void> {
    try {
      // Assume there's a GET /api/admin/events endpoint to fetch all events
      const eventsResponse = await this.http.get<any>(`${this.baseUrl}/events`, { headers: this.getAuthHeaders() }).toPromise();
      const events: Event[] = eventsResponse.events || []; // Adjust based on actual response structure
      console.log('Fetched events:', events);

      // Fetch registered families for all events
      const registeredPromises = events.map(event => 
        this.http.get<any>(`${this.baseUrl}/events/${event.id}/families`, { headers: this.getAuthHeaders() }).toPromise()
      );
      const registeredResponses = await Promise.all(registeredPromises);
      this.allRegisteredFamilies = events.map((event, index) => ({
        event,
        families: registeredResponses[index]?.families || []
      })).filter(group => group.families.length > 0);
      console.log('All registered families:', this.allRegisteredFamilies);

      // Flatten selected IDs for all families across groups
      let totalFamilies = 0;
      this.allRegisteredFamilies.forEach(group => totalFamilies += group.families.length);
      this.selectedFamilyIds = new Array(totalFamilies).fill(false);

      // Fetch confirmed families for all events
      const confirmedPromises = events.map(event => 
        this.http.get<any>(`${this.baseUrl}/events/${event.id}/confirmed-families`, { headers: this.getAuthHeaders() }).toPromise()
      );
      const confirmedResponses = await Promise.all(confirmedPromises);
      this.allConfirmedFamilies = events.map((event, index) => ({
        event,
        families: confirmedResponses[index]?.families || []
      })).filter(group => group.families.length > 0);
      console.log('All confirmed families:', this.allConfirmedFamilies);

      this.message = 'All families retrieved successfully';
      this.status = '200';
    } catch (error) {
      console.error('Error fetching all events and families:', error);
      this.message = 'Error fetching all families';
      this.status = '500';
    }
  }

  createEvent(): void {
    if (!this.userSessionDetails) return;

    const startDate = new Date(this.createEventRequest.startDate);
    const endDate = new Date(this.createEventRequest.endDate);

    const requestBody = {
      ...this.createEventRequest,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    this.http.post<MessageResponse>(`${this.baseUrl}/createEvent`, requestBody, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (response) => {
          this.createEventMessage = response.message;
          this.createEventStatus = response.status;
          this.resetCreateEventForm();
          // Refresh all after creating event
          this.fetchAllEventsAndFamilies();
        },
        error: (error) => {
          this.createEventMessage = error.error?.message || 'Error creating event';
          this.createEventStatus = error.error?.status || '500';
        }
      });
  }

  private resetCreateEventForm(): void {
    this.createEventRequest = {
      eventName: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      capacity: 0
    };
  }

  selectFamiliesForAll(): void {
    if (this.selectedFamilyIds.filter(id => id).length === 0 || !this.userSessionDetails) {
      this.message = 'Please select at least one family';
      this.status = '400';
      return;
    }

    // For simplicity, collect all selected userIds across all events and call select for each event separately
    let globalIndex = 0;
    this.allRegisteredFamilies.forEach(group => {
      group.families.forEach((family, localIndex) => {
        if (this.selectedFamilyIds[globalIndex]) {
          const requestBody: SelectFamiliesRequest = { userIds: [family.head?.userid] };
          this.http.post<MessageResponse>(`${this.baseUrl}/events/${group.event.id}/select-families`, requestBody, { headers: this.getAuthHeaders() })
            .subscribe({
              next: (response) => {
                console.log(`Selected family for event ${group.event.id}:`, response);
              },
              error: (error) => {
                console.error(`Error selecting family for event ${group.event.id}:`, error);
              }
            });
        }
        globalIndex++;
      });
    });

    this.message = 'Selected families across all events';
    this.status = '200';
    this.fetchAllEventsAndFamilies();
  }

  deleteUnselectedFamiliesForAll(): void {
    if (!this.userSessionDetails) return;

    // Call delete unselected for each event
    this.allRegisteredFamilies.forEach(group => {
      this.http.delete<MessageResponse>(`${this.baseUrl}/events/${group.event.id}/unselected-families`, { headers: this.getAuthHeaders() })
        .subscribe({
          next: (response) => {
            console.log(`Deleted unselected for event ${group.event.id}:`, response);
          },
          error: (error) => {
            console.error(`Error deleting unselected for event ${group.event.id}:`, error);
          }
        });
    });

    this.message = 'Deleted unselected families across all events';
    this.status = '200';
    this.fetchAllEventsAndFamilies(); // Refresh
  }
}