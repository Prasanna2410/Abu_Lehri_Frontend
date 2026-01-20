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

/** Standard backend wrapper */
interface ApiResponse<T> {
  code: any;
  message: string;
  data: T | null;
}

/** /api/event/user/{mobile}/info -> UserRegistrationSummary */
type UserRegistrationSummary = {
  fullName?: string;
  mobile?: string;
  tent?: string;
  [k: string]: any;
};

/**
 * /api/event/user/{mobile}/train -> Your Train Details
 * Keeping extra keys so it works even if backend returns different field names.
 */
type UserTrainDetails = {
  // preferred seat keys (we will try these first)
  trainOutboundSeat?: string | null;
  trainInboundSeat?: string | null;

  outboundSeat?: string | null;
  inboundSeat?: string | null;

  train_outbound_seat?: string | null;
  train_inbound_seat?: string | null;

  // old fields (we will ignore for UI, but keep for compatibility)
  pnrOutbound1?: string | null;
  pnrReturn1?: string | null;

  busInbound?: string | null;
  busOutbound?: string | null;

  [k: string]: any;
};

/** /api/profile/user/{mobile} -> UserProfileResponse */
interface UserProfileApiResponse {
  fullName: string;
  mobileNumber: string;
  profilePhoto: string | null;
}

/** Leaderboard optional */
interface LeaderboardResponse {
  rank: number;
  points: number;
  totalParticipants?: number;
}

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

  /** Optional kit status */
  kitGiven: boolean | null = null;

  // ✅ Based on your backend controllers
  private API_BASE = 'https://registration.lehriratnasangh.live/api/event';
  private YATRA_API_BASE = 'https://registration.lehriratnasangh.live/api/yatra';
  private PROFILE_API_BASE = 'https://registration.lehriratnasangh.live/api/profile';

  // ✅ Train preview for dashboard card (ONLY seat numbers)
  trainPreview = {
    outboundSeat: '—',
    inboundSeat: '—',
    showOutbound: false,
    showInbound: false,
  };

  userData: {
    name: string;

    // ✅ Next Event
    countdown: string;
    nextEventTitle: string;
    nextEventDateLabel: string; // "26 Jan 2026"

    // ✅ Tent
    tentNumber: string;

    // ✅ Points + rank
    dailyTasksPoints: number;
    spiritualQuizPoints: number;
    rank: number;
    points: number;

    // ✅ Bus (unchanged)
    bus: {
      busInbound: string;
      busOutbound: string;
    };
  } = {
    name: 'Loading...',
    countdown: '--d --h --m --s',
    nextEventTitle: '',
    nextEventDateLabel: '—',
    tentNumber: '—',
    dailyTasksPoints: 0,
    spiritualQuizPoints: 0,
    rank: 0,
    points: 0,
    bus: {
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

    // ✅ matches EventController
    this.loadUserInfo();     // /info
    this.loadTrainInfo();    // /train (seat only)
    this.loadKitStatus();    // /kit-status (optional)

    // ✅ Next event
    this.loadEventCountdown();

    // ⚠️ only keep if endpoint exists
    this.loadLeaderboard();
  }

  // ──────────────────────────────────────────────────────────────
  //                  Leaderboard (optional)
  // ──────────────────────────────────────────────────────────────
  private loadLeaderboard() {
    const url = `${this.API_BASE}/user/${this.mobile10}/leaderboard`;

    this.http.get<LeaderboardResponse>(url).subscribe({
      next: (res) => {
        if (res && typeof res.rank === 'number' && typeof res.points === 'number') {
          this.userData.rank = res.rank;
          this.userData.points = res.points;
        }
      },
      error: () => {
        this.userData.rank = this.userData.rank || 0;
        this.userData.points = this.userData.points || 0;
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  //                    Profile API
  // ──────────────────────────────────────────────────────────────
  private loadProfile() {
    const url = `${this.PROFILE_API_BASE}/user/${this.mobile10}`;

    this.http.get<UserProfileApiResponse>(url).subscribe({
      next: (res) => {
        if (!res) return;

        this.userData.name = res.fullName || this.userData.name;
        this.initials = this.getInitials(this.userData.name);

        this.profilePhotoUrl = this.buildProfilePhotoUrl(res.profilePhoto);
      },
      error: () => {
        this.profilePhotoUrl = null;
      },
    });
  }

  private buildProfilePhotoUrl(profilePhoto: string | null | undefined): string | null {
    if (!profilePhoto) return null;

    const clean = profilePhoto.replace(/\\/g, '/').trim();
    const parts = clean.split('/');
    const filename = parts[parts.length - 1];

    if (!filename) return null;

    return `${this.PROFILE_API_BASE}/photo/${encodeURIComponent(filename)}?t=${Date.now()}`;
  }

  onProfileImgError() {
    this.profilePhotoUrl = null;
  }

  // ──────────────────────────────────────────────────────────────
  //            ✅ /api/event/user/{mobile}/info
  // ──────────────────────────────────────────────────────────────
  private loadUserInfo() {
    const url = `${this.API_BASE}/user/${this.mobile10}/info`;

    this.http.get<ApiResponse<UserRegistrationSummary>>(url).subscribe({
      next: (res) => {
        const ok = String(res?.code) === '200';
        const d: any = res?.data;
        if (!ok || !d) return;

        // name
        this.userData.name =
          this.pickString(d, ['fullName', 'name', 'fullname']) || this.userData.name;

        // tent
        this.userData.tentNumber =
          this.pickString(d, ['tent', 'tentNumber', 'tent_no']) || this.userData.tentNumber;

        this.initials = this.getInitials(this.userData.name);
      },
      error: () => {},
    });
  }

  // ──────────────────────────────────────────────────────────────
  //            ✅ /api/event/user/{mobile}/train
  //            SHOW ONLY SEAT NUMBER
  // ──────────────────────────────────────────────────────────────
  private loadTrainInfo() {
    const url = `${this.API_BASE}/user/${this.mobile10}/train`;

    // reset
    this.trainPreview = {
      outboundSeat: '—',
      inboundSeat: '—',
      showOutbound: false,
      showInbound: false,
    };

    this.http.get<ApiResponse<UserTrainDetails>>(url).subscribe({
      next: (res) => {
        const ok = String(res?.code) === '200';
        const d: any = res?.data;
        if (!ok || !d) return;

        // ✅ Try multiple possible keys from backend for seat
        const outSeat =
          this.pickString(d, ['trainOutboundSeat', 'outboundSeat', 'train_outbound_seat']) || '';
        const inSeat =
          this.pickString(d, ['trainInboundSeat', 'inboundSeat', 'train_inbound_seat']) || '';

        // ✅ Store BUS too (unchanged)
        this.userData.bus = {
          busInbound: this.cleanOrDash(this.pickString(d, ['busInbound', 'bus_inbound'])),
          busOutbound: this.cleanOrDash(this.pickString(d, ['busOutbound', 'bus_outbound'])),
        };

        // ✅ Preview ONLY seat numbers
        if (this.cleanOrEmpty(outSeat)) {
          this.trainPreview.outboundSeat = this.cleanOrEmpty(outSeat);
          this.trainPreview.showOutbound = true;
        }

        if (this.cleanOrEmpty(inSeat)) {
          this.trainPreview.inboundSeat = this.cleanOrEmpty(inSeat);
          this.trainPreview.showInbound = true;
        }

        // If neither seat is present, remain as —
      },
      error: () => {},
    });
  }

  // ──────────────────────────────────────────────────────────────
  //        ✅ /api/event/user/{mobile}/kit-status (optional)
  // ──────────────────────────────────────────────────────────────
  private loadKitStatus() {
    const url = `${this.API_BASE}/user/${this.mobile10}/kit-status`;

    this.http.get<ApiResponse<boolean>>(url).subscribe({
      next: (res) => {
        const ok = String(res?.code) === '200';
        const val = res?.data;
        if (!ok) return;
        this.kitGiven = !!val;
      },
      error: () => {
        this.kitGiven = null;
      },
    });
  }

  // ──────────────────────────────────────────────────────────────
  //                     ✅ Next Event (FIXED)
  // ──────────────────────────────────────────────────────────────
  private loadEventCountdown() {
    const url = `${this.YATRA_API_BASE}/next-event`;

    this.http.get<NextEventResponse>(url).subscribe({
      next: (response) => {
        const ev = response?.event;
        const cd = response?.countdown;

        // Countdown (use formatted directly)
        this.userData.countdown = cd?.formatted || this.userData.countdown;

        // Title
        this.userData.nextEventTitle = ev?.title || '';

        // Date (no more hardcoded "26th")
        if (ev?.gregorianDate) {
          this.userData.nextEventDateLabel = this.formatEventDate(ev.gregorianDate);
        } else {
          this.userData.nextEventDateLabel = '—';
        }
      },
      error: () => {
        this.userData.countdown = 'Soon';
        this.userData.nextEventDateLabel = '—';
      },
    });
  }

  private formatEventDate(dateStr: string): string {
    // dateStr could be "2026-01-26" or ISO
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

  goToTravelInfo() {
    this.router.navigate(['/travelinfo']);
  }

  goToBusInfo() {
    this.router.navigate(['/businfo'], {
      queryParams: {
        busInbound: this.userData.bus.busInbound,
        busOutbound: this.userData.bus.busOutbound,
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

  // ──────────────────────────────────────────────────────────────
  //                       Helpers
  // ──────────────────────────────────────────────────────────────
  private cleanOrEmpty(v: any): string {
    return (v ?? '').toString().trim();
  }

  private cleanOrDash(v: any): string {
    const s = this.cleanOrEmpty(v);
    return s ? s : '—';
  }

  private normalizeMobile(mobile: string): string {
    let digits = (mobile || '').replace(/\D/g, '');
    if (digits.length < 10) return '';
    if (digits.length > 10) digits = digits.substring(digits.length - 10);
    return digits;
  }

  private pickString(obj: any, keys: string[]): string {
    for (const k of keys) {
      const v = obj?.[k];
      if (v !== undefined && v !== null) {
        const s = v.toString().trim();
        if (s) return s;
      }
    }
    return '';
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
