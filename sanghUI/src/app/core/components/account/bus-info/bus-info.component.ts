// src/app/pages/bus-info/bus-info.component.ts
import { Component, OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Location } from '@angular/common'

interface EventParticipantDetails {
  fullName?: string
  mobile?: string
  busInbound?: string
  busOutbound?: string
}

interface EventParticipantApiResponse {
  code?: string
  message?: string
  details?: EventParticipantDetails | null
}

interface BusOccupantLite {
  fullName?: string
  mobile?: string
}

interface BusOccupantsResponse {
  code?: string
  status?: string
  message?: string
  details?: BusOccupantLite[] | null
  occupants?: BusOccupantLite[] | null
}

interface BusMember {
  fullName: string
  mobile: string
}

@Component({
  selector: 'app-bus-info',
  templateUrl: './bus-info.component.html',
  styleUrls: ['./bus-info.component.css'],
})
export class BusInfoComponent implements OnInit {
  mobileNumber = ''

  busInbound: string = '—'
  busOutbound: string = '—'

  inboundMembers: BusMember[] = []
  outboundMembers: BusMember[] = []

  isLoadingInbound = false
  isLoadingOutbound = false

  errorInbound = ''
  errorOutbound = ''

  private API_BASE = 'https://192.168.1.46:8080/api/event'

  constructor(private http: HttpClient, private location: Location) {}

  ngOnInit(): void {
    const raw = sessionStorage.getItem('UserDetails')
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      this.mobileNumber = parsed.username || ''
    } catch {
      return
    }

    if (!this.mobileNumber) return

    this.loadMyBusNumbers()
  }

  private loadMyBusNumbers(): void {
    const url = `${this.API_BASE}/user/${this.mobileNumber}/accommodation`

    this.http.get<EventParticipantApiResponse>(url).subscribe({
      next: (res) => {
        if (res.code === '200' && res.details) {
          const d = res.details

          this.busInbound = (d.busInbound || '').trim() || '—'
          this.busOutbound = (d.busOutbound || '').trim() || '—'

          if (this.busInbound && this.busInbound !== '—') {
            this.loadInboundOccupants(this.busInbound)
          }
          if (this.busOutbound && this.busOutbound !== '—') {
            this.loadOutboundOccupants(this.busOutbound)
          }
        }
      },
      error: (err) => {
        console.error('Failed to load accommodation / bus numbers', err)
      },
    })
  }

  private loadInboundOccupants(busNumber: string): void {
    this.isLoadingInbound = true
    this.errorInbound = ''
    this.inboundMembers = []

    const url = `${this.API_BASE}/bus/inbound/${encodeURIComponent(busNumber)}/occupants`

    this.http.get<BusOccupantsResponse>(url).subscribe({
      next: (res) => {
        this.isLoadingInbound = false

        const ok =
          res &&
          (res.code === '200' ||
            res.status === '200' ||
            res.status === 'OK' ||
            res.status === 'Success')

        const list =
          (res.details as BusOccupantLite[]) ??
          (res.occupants as BusOccupantLite[]) ??
          []

        if (ok && Array.isArray(list)) {
          this.inboundMembers = list.map((p) => ({
            fullName: (p.fullName || '').trim() || 'Unnamed Member',
            mobile: (p.mobile || '').trim() || '-',
          }))

          if (this.inboundMembers.length === 0) {
            this.errorInbound = 'No members found for this bus yet.'
          }
        } else {
          this.errorInbound = res?.message || 'No occupants found for this bus.'
        }
      },
      error: (err) => {
        console.error('Failed to load inbound bus occupants', err)
        this.isLoadingInbound = false
        this.errorInbound = 'Unable to load bus members. Please try again later.'
      },
    })
  }

  private loadOutboundOccupants(busNumber: string): void {
    this.isLoadingOutbound = true
    this.errorOutbound = ''
    this.outboundMembers = []

    const url = `${this.API_BASE}/bus/outbound/${encodeURIComponent(busNumber)}/occupants`

    this.http.get<BusOccupantsResponse>(url).subscribe({
      next: (res) => {
        this.isLoadingOutbound = false

        const ok =
          res &&
          (res.code === '200' ||
            res.status === '200' ||
            res.status === 'OK' ||
            res.status === 'Success')

        const list =
          (res.details as BusOccupantLite[]) ??
          (res.occupants as BusOccupantLite[]) ??
          []

        if (ok && Array.isArray(list)) {
          this.outboundMembers = list.map((p) => ({
            fullName: (p.fullName || '').trim() || 'Unnamed Member',
            mobile: (p.mobile || '').trim() || '-',
          }))

          if (this.outboundMembers.length === 0) {
            this.errorOutbound = 'No members found for this bus yet.'
          }
        } else {
          this.errorOutbound = res?.message || 'No occupants found for this bus.'
        }
      },
      error: (err) => {
        console.error('Failed to load outbound bus occupants', err)
        this.isLoadingOutbound = false
        this.errorOutbound = 'Unable to load bus members. Please try again later.'
      },
    })
  }

  getInitials(name: string): string {
    if (!name) return 'NA'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  goBack(): void {
    this.location.back()
  }
}