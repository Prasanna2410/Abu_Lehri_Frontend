import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';

interface NextEventResponse {
  event: YatraEventDto;
  countdown: CountdownDto;
  hasStarted: boolean;
}

interface YatraEventDto {
  dayNumber: number;
  title: string;
  hindiDate: string;
  gregorianDate: string;
  distanceKm: number | null;
  icon: string;
  badgeColor: string;
  gradientBg: string;
}

interface CountdownDto {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

interface EventParticipantApiResponse {
  code: any;
  message: string;
  details: EventParticipantDetails | null;
}

interface EventParticipantDetails {
  fullName?: string;
  mobile?: string;
  tent?: string;

  // Accommodation
  roomStay1?: string;     // 12th Jan room
  roomInbound?: string;   // 8th Jan room

  // Flight PNRS
  pnrOutbound1?: string | null;
  pnrOutbound2?: string | null;
  pnrOutbound3?: string | null;
  pnrOutbound4?: string | null;
  pnrReturn1?: string | null;
  pnrReturn2?: string | null;
  pnrReturn3?: string | null;
  pnrReturn4?: string | null;

  busInbound?: string | null;
  busOutbound?: string | null;
}

interface UserProfileApiResponse {
  userid: number;
  fullName: string;
  mobileNumber: string;
  profilePhoto: string | null;
}

// Leaderboard response (adjust according to your actual API)
interface LeaderboardResponse {
  rank: number;
  points: number;
  totalParticipants?: number; // optional
}

type FlightSlot = {
  flightNo: 1 | 2 | 3 | 4;
  pnr: string;
};

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
  showProfileMenu = false;
  initials = '';
  mobileNumber: string = '';
  private mobile10: string = '';

  /** dashboard avatar */
  profilePhotoUrl: string | null = null;

  private API_BASE = 'https://api.shreesanghutsav.com/api/event';
  private YATRA_API_BASE = 'https://api.shreesanghutsav.com/api/yatra';
  private PROFILE_API_BASE = 'https://api.shreesanghutsav.com/api/profile';

  // Derived preview for flight card
  flightPreview = {
    outbound: '—',
    inbound: '—',
    showOutbound: false,
    showInbound: false,
  };

  userData: {
    name: string;
    countdown: string;
    eventStart: string;
    nextEventTitle: string;
    tentNumber: string;
    roomInbound: string;
    roomStay1: string;
    roomNumber: string;
    dailyTasksPoints: number;
    spiritualQuizPoints: number;
    rank: number;
    points: number;
    flight: {
      pnrOutbound1: string;
      pnrOutbound2: string;
      pnrOutbound3: string;
      pnrOutbound4: string;
      pnrReturn1: string;
      pnrReturn2: string;
      pnrReturn3: string;
      pnrReturn4: string;
      busInbound: string;
      busOutbound: string;
    };
  } = {
    name: 'Loading...',
    countdown: '--d --h --m --s',
    eventStart: 'January 2026',
    nextEventTitle: '',
    tentNumber: '—',
    roomInbound: '',
    roomStay1: '',
    roomNumber: '—',
    dailyTasksPoints: 0,
    spiritualQuizPoints: 0,
    rank: 0,
    points: 0,
    flight: {
      pnrOutbound1: '—',
      pnrOutbound2: '—',
      pnrOutbound3: '—',
      pnrOutbound4: '—',
      pnrReturn1: '—',
      pnrReturn2: '—',
      pnrReturn3: '—',
      pnrReturn4: '—',
      busInbound: '—',
      busOutbound: '—',
    },
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private location: Location,
    private auth: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    const user = await this.auth.getLoggedInUserDetailsAsync();
    this.mobileNumber = user?.username || '';

    if (!this.mobileNumber) {
      this.router.navigate(['/login']);
      return;
    }

    this.mobile10 = this.normalizeMobile(this.mobileNumber);
    if (!this.mobile10) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadAll();
  }

  private loadAll() {
    this.loadProfile();
    this.loadUserInfo();
    this.loadAccommodationInfo();
    this.loadFlightInfo();
    this.loadEventCountdown();
    this.loadLeaderboard();           // ← NEW
  }

  // ──────────────────────────────────────────────────────────────
  //                  NEW: Leaderboard Data
  // ──────────────────────────────────────────────────────────────
  private loadLeaderboard() {
    // Adjust endpoint to match your actual API
    const url = `${this.API_BASE}/user/${this.mobile10}/leaderboard`;

    this.http.get<LeaderboardResponse>(url).subscribe({
      next: (res) => {
        if (res && typeof res.rank === 'number' && typeof res.points === 'number') {
          this.userData.rank = res.rank;
          this.userData.points = res.points;
        }
      },
      error: () => {
        // Fallback / silent fail
        this.userData.rank = 0;
        this.userData.points = 0;
      },
    });
  }

  /** Dashboard avatar + name from profile API */
  private loadProfile() {
    const url = `${this.PROFILE_API_BASE}/user/${this.mobile10}`;
    this.http.get<UserProfileApiResponse>(url).subscribe({
      next: (res) => {
        if (res) {
          this.userData.name = res.fullName || this.userData.name;
          this.initials = this.getInitials(this.userData.name);
          this.profilePhotoUrl = this.buildProfilePhotoUrl(res.profilePhoto);
        }
      },
      error: () => {
        this.profilePhotoUrl = null;
      },
    });
  }

  private buildProfilePhotoUrl(profilePhoto: string | null | undefined): string | null {
    if (!profilePhoto) return null;
    const parts = profilePhoto.split('/');
    const filename = parts[parts.length - 1];
    if (!filename) return null;
    return `${this.PROFILE_API_BASE}/photo/${filename}?t=${Date.now()}`;
  }

  onProfileImgError() {
    this.profilePhotoUrl = null;
  }

  // ──────────────────────────────────────────────────────────────
  //                     Existing Methods
  // ──────────────────────────────────────────────────────────────

  private trimOrEmpty(v: any): string {
    return (v ?? '').toString().trim();
  }

  private recomputeRoomNumber() {
    const inbound = this.trimOrEmpty(this.userData.roomInbound);
    const stay = this.trimOrEmpty(this.userData.roomStay1);
    this.userData.roomNumber = inbound || stay || '—';
  }

  private loadUserInfo() {
    const url = `${this.API_BASE}/user/${this.mobile10}/info`;
    this.http.get<EventParticipantApiResponse>(url).subscribe({
      next: (res) => {
        const ok = String(res?.code) === '200';
        if (ok && res.details) {
          const d = res.details;
          this.userData.name = d.fullName || this.userData.name;
          this.userData.tentNumber = this.trimOrEmpty(d.tent) || '—';

          this.userData.roomInbound = this.trimOrEmpty(d.roomInbound);
          this.userData.roomStay1 = this.trimOrEmpty(d.roomStay1);

          this.recomputeRoomNumber();
          this.initials = this.getInitials(this.userData.name);
        }
      },
      error: () => {},
    });
  }

  private normalizeMobile(mobile: string): string {
    let digits = (mobile || '').replace(/\D/g, '');
    if (digits.length > 10) digits = digits.substring(digits.length - 10);
    return digits;
  }

  private hasValidPnr(v: any): boolean {
    const s = (v ?? '').toString().trim();
    if (!s) return false;
    const up = s.toUpperCase();
    if (s === '—' || s === '-' || up.includes('NO FLIGHT')) return false;
    return true;
  }

  private extractFlightSlots(d: EventParticipantDetails): FlightSlot[] {
    const candidates: { flightNo: 1 | 2 | 3 | 4; val: any }[] = [
      { flightNo: 1, val: d.pnrOutbound1 },
      { flightNo: 2, val: d.pnrOutbound2 },
      { flightNo: 3, val: d.pnrReturn1 },
      { flightNo: 4, val: d.pnrReturn2 },
      { flightNo: 3, val: d.pnrOutbound3 },
      { flightNo: 4, val: d.pnrOutbound4 },
      { flightNo: 3, val: d.pnrReturn3 },
      { flightNo: 4, val: d.pnrReturn4 },
    ];

    const perNo: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const c of candidates) {
      if (this.hasValidPnr(c.val)) {
        perNo[c.flightNo].push(c.val.toString().trim());
      }
    }

    const out: FlightSlot[] = [];
    for (const n of [1, 2, 3, 4] as const) {
      const list = perNo[n];
      if (!list.length) continue;
      const seen = new Set<string>();
      const unique = list.filter((x) => {
        const key = x.toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (unique.length) out.push({ flightNo: n, pnr: unique[0] });
    }

    return out.sort((a, b) => a.flightNo - b.flightNo);
  }

  private joinPnrs(slots: FlightSlot[]): string {
    if (!slots.length) return '—';
    return slots
      .sort((a, b) => a.flightNo - b.flightNo)
      .map((s) => `FL${s.flightNo}: ${s.pnr}`)
      .join(' • ');
  }

  private loadFlightInfo() {
    const url = `${this.API_BASE}/user/${this.mobile10}/flight`;

    this.flightPreview = { outbound: '—', inbound: '—', showOutbound: false, showInbound: false };

    this.http.get<EventParticipantApiResponse>(url).subscribe({
      next: (res) => {
        const ok = String(res?.code) === '200';
        if (!ok || !res.details) return;

        const d = res.details;

        this.userData.flight = {
          pnrOutbound1: d.pnrOutbound1 || '—',
          pnrOutbound2: d.pnrOutbound2 || '—',
          pnrOutbound3: d.pnrOutbound3 || '—',
          pnrOutbound4: d.pnrOutbound4 || '—',
          pnrReturn1: d.pnrReturn1 || '—',
          pnrReturn2: d.pnrReturn2 || '—',
          pnrReturn3: d.pnrReturn3 || '—',
          pnrReturn4: d.pnrReturn4 || '—',
          busInbound: d.busInbound || '—',
          busOutbound: d.busOutbound || '—',
        };

        const slots = this.extractFlightSlots(d);
        const outboundSlots = slots.filter((s) => s.flightNo === 1 || s.flightNo === 2);
        const inboundSlots = slots.filter((s) => s.flightNo === 3 || s.flightNo === 4);

        this.flightPreview.outbound = this.joinPnrs(outboundSlots);
        this.flightPreview.inbound = this.joinPnrs(inboundSlots);
        this.flightPreview.showOutbound = outboundSlots.length > 0;
        this.flightPreview.showInbound = inboundSlots.length > 0;
      },
      error: () => {},
    });
  }

  private loadAccommodationInfo() {
    const url = `${this.API_BASE}/user/${this.mobile10}/accommodation`;
    this.http.get<EventParticipantApiResponse>(url).subscribe({
      next: (res) => {
        const ok = String(res?.code) === '200';
        if (ok && res.details) {
          const d = res.details;

          if (this.trimOrEmpty(d.tent)) this.userData.tentNumber = this.trimOrEmpty(d.tent);

          const inbound = this.trimOrEmpty(d.roomInbound);
          const stay = this.trimOrEmpty(d.roomStay1);

          if (inbound) this.userData.roomInbound = inbound;
          if (stay) this.userData.roomStay1 = stay;

          this.recomputeRoomNumber();
        }
      },
      error: () => {},
    });
  }

  private loadEventCountdown() {
    const url = `${this.YATRA_API_BASE}/next-event`;
    this.http.get<NextEventResponse>(url).subscribe({
      next: (response) => {
        if (response?.countdown?.formatted) this.userData.countdown = response.countdown.formatted;

        if (response?.event?.gregorianDate) {
          this.userData.eventStart = new Date(response.event.gregorianDate).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
        }

        this.userData.nextEventTitle = response?.event?.title || '';
      },
      error: () => {
        this.userData.countdown = 'Soon';
        this.userData.eventStart = 'January 2026';
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  //                        Navigation
  // ──────────────────────────────────────────────────────────────

  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  toggleProfileMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  goToProfile() {
    this.showProfileMenu = false;
    this.router.navigate(['/profile'], { queryParams: { mobile: this.mobile10 } });
  }

  goToTentInfo() {
    this.router.navigate(['/tentinfo'], { queryParams: { tent: this.userData.tentNumber } });
  }

  goToRoomInfo() {
    this.router.navigate(['/roominfo'], {
      queryParams: {
        room: this.userData.roomNumber,
        roomStay: this.userData.roomStay1,
        roomInbound: this.userData.roomInbound,
      },
    });
  }

  goToTravelInfo() {
    this.router.navigate(['/travelinfo']);
  }

  goToBusInfo() {
    this.router.navigate(['/businfo'], {
      queryParams: {
        busInbound: this.userData.flight.busInbound,
        busOutbound: this.userData.flight.busOutbound,
      },
    });
  }

  goToDailyTasks() {
    this.showProfileMenu = false;
    this.router.navigate(['/dailytasks']);
  }

  goToQuizes() {
    this.showProfileMenu = false;
    this.router.navigate(['/quizes']);
  }

  goToEvents() {
    this.router.navigate(['/events']);
  }

  goToLeaderboard() {
    this.router.navigate(['/leaderboard']);
  }

  async logout(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.showProfileMenu = false;
    await this.auth.logout();
  }

  goBack(event?: Event) {
    if (event) event.stopPropagation();
    const hasHistory = window.history.length > 1;
    if (hasHistory) this.location.back();
    else this.router.navigate(['/events']);
  }

  getInitials(name: string): string {
    if (!name) return 'JJ';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase() || 'JJ';
  }

  clamp(val: number): number {
    return Math.max(0, Math.min(100, val || 0));
  }
}