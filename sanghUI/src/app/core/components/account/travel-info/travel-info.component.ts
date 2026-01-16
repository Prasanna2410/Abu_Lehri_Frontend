import { Component, OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Location } from '@angular/common'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/services/auth.service'

interface EventParticipantApiResponse {
  code: any
  message: string
  details: EventParticipantDetails | null
}

interface EventParticipantDetails {
  mobile?: string
  fullName?: string

  pnrOutbound1?: string | null
  pnrOutbound2?: string | null
  pnrReturn1?: string | null
  pnrReturn2?: string | null
}

type FlightCard = {
  flightNo: 1 | 2 | 3 | 4
  title: string
  route: string
  airline: string
  time: string
  pnr: string
}

@Component({
  selector: 'app-travel-info',
  templateUrl: './travel-info.component.html',
  styleUrls: ['./travel-info.component.css'],
})
export class TravelInfoComponent implements OnInit {
  private API_BASE = 'https://192.168.1.46:8080/api/event'

  mobileNumber = ''
  mobile10 = ''
  fullName = ''

  loading = false
  err = ''

  outboundFlights: FlightCard[] = []
  inboundFlights: FlightCard[] = []

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

    this.loadFlightDetails()
  }

  goBack() {
    this.location.back()
  }

  private normalizeMobile(mobile: string): string {
    let digits = (mobile || '').replace(/\D/g, '')
    if (digits.length > 10) digits = digits.substring(digits.length - 10)
    return digits
  }

  private hasValidPnr(v?: any): boolean {
    const s = (v ?? '').toString().trim()
    if (!s) return false
    const up = s.toUpperCase()
    if (s === '—' || s === '-' || up.includes('NO FLIGHT')) return false
    return true
  }

  private meta(flightNo: 1 | 2 | 3 | 4) {
    switch (flightNo) {
      case 1:
        return {
          title: 'FLIGHT - 1 - 7.01.2026',
          route: 'PNQ - AMD',
          airline: 'Akasa Air - QP 1510',
          time: '6 PM',
        }
      case 2:
        return {
          title: 'FLIGHT - 2 - 7.01.2026',
          route: 'PNQ - AMD',
          airline: 'Akasa Air - QP 1509',
          time: '10:10 PM',
        }
      case 3:
        return {
          title: 'FLIGHT - 3 - 14.01.2026',
          route: 'AMD - PNQ',
          airline: 'INDIGO - 6E 699',
          time: '2:30 AM',
        }
      case 4:
        return {
          title: 'FLIGHT - 4 - 14.01.2026',
          route: 'AMD - PNQ',
          airline: 'Akasa Air - QP 1505',
          time: '5:35 AM',
        }
    }
  }

  private loadFlightDetails() {
    this.loading = true
    this.err = ''
    this.outboundFlights = []
    this.inboundFlights = []

    const url = `${this.API_BASE}/user/${this.mobile10}/flight`

    this.http.get<EventParticipantApiResponse>(url).subscribe({
      next: (res) => {
        this.loading = false

        const ok = String(res?.code) === '200'
        if (!ok || !res.details) {
          this.err = 'Flight details not available.'
          return
        }

        const d = res.details
        this.fullName = d.fullName || ''

        // ✅ Flight 1
        if (this.hasValidPnr(d.pnrOutbound1)) {
          const m = this.meta(1)
          this.outboundFlights.push({
            flightNo: 1,
            ...m,
            pnr: d.pnrOutbound1!.toString().trim(),
          })
        }

        // ✅ Flight 2
        if (this.hasValidPnr(d.pnrOutbound2)) {
          const m = this.meta(2)
          this.outboundFlights.push({
            flightNo: 2,
            ...m,
            pnr: d.pnrOutbound2!.toString().trim(),
          })
        }

        // ✅ Flight 3
        if (this.hasValidPnr(d.pnrReturn1)) {
          const m = this.meta(3)
          this.inboundFlights.push({
            flightNo: 3,
            ...m,
            pnr: d.pnrReturn1!.toString().trim(),
          })
        }

        // ✅ Flight 4
        if (this.hasValidPnr(d.pnrReturn2)) {
          const m = this.meta(4)
          this.inboundFlights.push({
            flightNo: 4,
            ...m,
            pnr: d.pnrReturn2!.toString().trim(),
          })
        }

        // Sort just in case
        this.outboundFlights.sort((a, b) => a.flightNo - b.flightNo)
        this.inboundFlights.sort((a, b) => a.flightNo - b.flightNo)
      },
      error: () => {
        this.loading = false
        this.err = 'Unable to fetch flight details.'
      },
    })
  }
}
