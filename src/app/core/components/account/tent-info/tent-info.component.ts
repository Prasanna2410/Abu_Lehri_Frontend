// src/app/core/components/account/tent-info/tent-info.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface LegacyTentOccupantsResponse {
  status?: string; // "200"
  message?: string;
  occupants?: { fullName?: string; mobile?: string }[] | null;
}

interface NewTentOccupantsResponse {
  code?: string; // "200"
  message?: string;
  details?: { fullName?: string; mobile?: string }[] | null;
}

type TentOccupantsResponse = LegacyTentOccupantsResponse & NewTentOccupantsResponse;

interface TentMember {
  fullName: string;
  mobile: string;
}

@Component({
  selector: 'app-tent-info',
  templateUrl: './tent-info.component.html',
  styleUrls: ['./tent-info.component.css'],
})
export class TentInfoComponent implements OnInit {
  tentNumber: string = '—';
  tentMembers: TentMember[] = [];

  isLoading = false;
  errorMessage = '';

  // For Capacitor on real device, replace localhost with your machine IP
  private API_BASE = 'https://registration.lehriratnasangh.live/api/event';

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tent = params.get('tent');

      if (tent && tent.trim().length > 0 && tent !== '—') {
        this.tentNumber = tent.trim();
        this.loadTentOccupants();
      } else {
        this.tentNumber = '—';
        this.tentMembers = [];
        this.errorMessage = '';
      }
    });
  }

  /**
   * Calls backend:
   *   GET /api/event/tent/{tentIdentifier}/occupants
   * Supports both:
   *   { status: "200", message, occupants: [...] }
   *   { code: "200", message, details: [...] }
   */
  private loadTentOccupants(): void {
    if (!this.tentNumber || this.tentNumber === '—') {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.tentMembers = [];

    const url = `${this.API_BASE}/tent/${encodeURIComponent(
      this.tentNumber
    )}/occupants`;

    this.http.get<TentOccupantsResponse>(url).subscribe({
      next: (res) => {
        console.log('Tent occupants response', res);
        this.isLoading = false;

        const ok =
          res &&
          (res.code === '200' ||
            res.status === '200' ||
            res.status === 'OK' ||
            res.status === 'Success');

        const list =
          (res.details as { fullName?: string; mobile?: string }[] | null | undefined) ??
          (res.occupants as { fullName?: string; mobile?: string }[] | null | undefined) ??
          [];

        if (ok && Array.isArray(list)) {
          this.tentMembers = list.map((o) => ({
            fullName: (o.fullName || '').trim() || 'Unnamed Member',
            mobile: (o.mobile || '').trim() || '-',
          }));

          if (this.tentMembers.length === 0) {
            this.errorMessage = 'No members found for this tent yet.';
          } else {
            this.errorMessage = '';
          }
        } else {
          this.errorMessage =
            res?.message || 'No occupants found for this tent.';
        }
      },
      error: (err) => {
        console.error('Failed to load tent occupants', err);
        this.isLoading = false;
        this.tentMembers = [];
        this.errorMessage =
          'Unable to load tent members. Please try again later.';
      },
    });
  }

  getInitials(fullName: string): string {
    if (!fullName || fullName.trim().length === 0) {
      return 'NA';
    }

    const parts = fullName.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    const firstInitial = (parts[0]?.[0] || '').toUpperCase();
    const lastInitial = (parts[parts.length - 1]?.[0] || '').toUpperCase();

    return firstInitial + lastInitial;
  }

  goBack(): void {
    this.location.back();
  }
}
