import { Component, OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Location } from '@angular/common'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/services/auth.service'

interface ApiResponse<T> {
  code: any
  message: string
  data: T | null
}

type UserTrainDetails = {
  mobile?: string
  fullName?: string

  trainInboundDate?: string | null
  trainInboundName?: string | null
  trainInboundCoach?: string | null
  trainInboundPnr?: string | null
  trainInboundNo?: string | number | null
  trainInboundTime?: string | number | null
  trainInboundBoarding?: string | null
  trainInboundSeat?: string | number | null

  kitGiven?: boolean
  [k: string]: any
}

type TrainInfoView = {
  trainName: string
  trainNumber: string
  date: string
  time: string
  boarding: string
  coach: string
  seatNumber: string
  pnr: string
}

@Component({
  selector: 'app-travel-info',
  templateUrl: './travel-info.component.html',
  styleUrls: ['./travel-info.component.css'],
})
export class TravelInfoComponent implements OnInit {
  private API_BASE = 'https://registration.lehriratnasangh.live/api/event'
  // private API_BASE = 'https://registration.lehriratnasangh.live/api/event'

  mobileNumber = ''
  mobile10 = ''
  fullName = ''

  loading = false
  err = ''

  train: TrainInfoView | null = null

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private location: Location,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const user = await this.auth.getLoggedInUserDetailsAsync()
    this.mobileNumber = user?.username || ''

    if (!this.mobileNumber) {
      this.router.navigate(['/login'])
      return
    }

    this.mobile10 = this.normalizeMobile(this.mobileNumber)
    if (!this.mobile10) {
      this.router.navigate(['/login'])
      return
    }

    this.loadTrainDetails()
  }

  goBack() {
    this.location.back()
  }

  private normalizeMobile(mobile: string): string {
    let digits = (mobile || '').replace(/\D/g, '')
    if (digits.length < 10) return ''
    if (digits.length > 10) digits = digits.substring(digits.length - 10)
    return digits
  }

  private trimOrEmpty(v: any): string {
    return (v ?? '').toString().trim()
  }

  private dashIfEmpty(v: any): string {
    const s = this.trimOrEmpty(v)
    return s ? s : '—'
  }

  /** Converts "5.02" -> "5:02", "6.28" -> "6:28", otherwise returns as-is */
  private formatTime(v: any): string {
    if (v === null || v === undefined) return '—'
    const s = this.trimOrEmpty(v)
    if (!s) return '—'

    if (/^\d+(\.\d+)?$/.test(s) && s.includes('.')) {
      const [hStr, mStrRaw] = s.split('.')
      const h = parseInt(hStr, 10)
      const m = parseInt((mStrRaw || '0').padEnd(2, '0').slice(0, 2), 10)
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        return `${h}:${String(m).padStart(2, '0')}`
      }
    }
    return s
  }

  private formatDateISOToPretty(iso: string): string {
    // iso: "2026-01-25"
    try {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return iso
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  private hasAnyTrainData(d: UserTrainDetails): boolean {
    const name = this.trimOrEmpty(d?.trainInboundName)
    const num = this.trimOrEmpty(d?.trainInboundNo)
    const date = this.trimOrEmpty(d?.trainInboundDate)
    const time = this.trimOrEmpty(d?.trainInboundTime)
    const seat = this.trimOrEmpty(d?.trainInboundSeat)
    const coach = this.trimOrEmpty(d?.trainInboundCoach)
    const boarding = this.trimOrEmpty(d?.trainInboundBoarding)
    const pnr = this.trimOrEmpty(d?.trainInboundPnr)
    return !!(name || num || date || time || seat || coach || boarding || pnr)
  }

  private loadTrainDetails() {
    this.loading = true
    this.err = ''
    this.train = null

    const url = `${this.API_BASE}/user/${this.mobile10}/train`

    this.http.get<ApiResponse<UserTrainDetails>>(url).subscribe({
      next: (res) => {
        this.loading = false

        const ok = String(res?.code) === '200'
        const d = res?.data
        if (!ok || !d) {
          this.err = res?.message || 'Train details not available.'
          return
        }

        this.fullName = this.dashIfEmpty(d.fullName)

        if (!this.hasAnyTrainData(d)) {
          this.train = null
          return
        }

        const trainName = this.dashIfEmpty(d.trainInboundName)
        const trainNumber = this.dashIfEmpty(d.trainInboundNo)
        const date = d.trainInboundDate ? this.formatDateISOToPretty(d.trainInboundDate) : '—'
        const time = this.formatTime(d.trainInboundTime)

        const boarding = this.dashIfEmpty(d.trainInboundBoarding)
        const coach = this.dashIfEmpty(d.trainInboundCoach)
        const seatNumber = this.dashIfEmpty(d.trainInboundSeat)

        // IMPORTANT: your API returns "" for pnr sometimes -> show —
        const pnr = this.dashIfEmpty(d.trainInboundPnr)

        this.train = {
          trainName,
          trainNumber,
          date,
          time,
          boarding,
          coach,
          seatNumber,
          pnr,
        }
      },
      error: () => {
        this.loading = false
        this.err = 'Unable to fetch train details.'
      },
    })
  }
}
