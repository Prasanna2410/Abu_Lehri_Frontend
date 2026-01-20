// src/app/core/components/account/room-info/room-info.component.ts
import { Component, OnInit } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { forkJoin, of } from 'rxjs'
import { catchError } from 'rxjs/operators'

interface LegacyRoomOccupantsResponse {
  status?: string
  message?: string
  occupants?: { fullName?: string; mobile?: string }[] | null
}

interface NewRoomOccupantsResponse {
  code?: string
  message?: string
  details?: { fullName?: string; mobile?: string }[] | null
}

type RoomOccupantsResponse = LegacyRoomOccupantsResponse & NewRoomOccupantsResponse

interface RoomMember {
  fullName: string
  mobile: string
}

@Component({
  selector: 'app-room-info',
  templateUrl: './room-info.component.html',
  styleUrls: ['./room-info.component.css'],
})
export class RoomInfoComponent implements OnInit {
  roomStay: string = '—' // 12th Jan (room_stay1)
  roomInbound: string = '—' // 8th Jan (room_inbound)

  inboundMembers: RoomMember[] = []
  stayMembers: RoomMember[] = []

  isLoading = false
  errorMessage = ''

  // ✅ for template conditions
  hasInbound = false
  hasStay = false

  // change to prod base when deploying
  private API_BASE = 'https://registration.lehriratnasangh.live/api/event'

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.roomStay = (params.get('roomStay') || '').trim() || '—'
      this.roomInbound = (params.get('roomInbound') || '').trim() || '—'
      this.loadBothRoomOccupants()
    })
  }

  get totalMembers(): number {
    return (this.inboundMembers?.length || 0) + (this.stayMembers?.length || 0)
  }

  private isValidRoom(v?: string | null): boolean {
    const s = (v ?? '').toString().trim()
    if (!s) return false
    if (s === '—' || s === '-') return false
    return true
  }

  private normalizeRoom(room: string): string {
    // normalize spacing so "101 " and " 101" behave same
    return (room || '').trim().replace(/\s+/g, ' ')
  }

  private noCache(url: string): string {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}t=${Date.now()}`
  }

  /**
   * ✅ IMPORTANT (NO FALLBACK):
   * 8th -> /room/inbound/{room}/occupants  (roomInbound column)
   * 12th -> /room/stay/{room}/occupants    (roomStay1 column)
   *
   * Even if roomInbound === roomStay, we still call both endpoints so
   * each list is correct "for that day".
   */
  private loadBothRoomOccupants(): void {
    this.isLoading = true
    this.errorMessage = ''
    this.inboundMembers = []
    this.stayMembers = []

    this.hasInbound = this.isValidRoom(this.roomInbound)
    this.hasStay = this.isValidRoom(this.roomStay)

    if (!this.hasInbound && !this.hasStay) {
      this.isLoading = false
      this.errorMessage = 'Room details not available yet.'
      return
    }

    const inboundRoom = this.normalizeRoom(this.roomInbound)
    const stayRoom = this.normalizeRoom(this.roomStay)

    const inbound$ = this.hasInbound
      ? this.http
          .get<RoomOccupantsResponse>(
            this.noCache(
              `${this.API_BASE}/room/inbound/${encodeURIComponent(inboundRoom)}/occupants`
            )
          )
          .pipe(catchError((e) => of({ code: '500', status: '500', message: this.errMsg(e) } as any)))
      : of(null)

    const stay$ = this.hasStay
      ? this.http
          .get<RoomOccupantsResponse>(
            this.noCache(
              `${this.API_BASE}/room/stay/${encodeURIComponent(stayRoom)}/occupants`
            )
          )
          .pipe(catchError((e) => of({ code: '500', status: '500', message: this.errMsg(e) } as any)))
      : of(null)

    forkJoin({ inboundRes: inbound$, stayRes: stay$ }).subscribe({
      next: ({ inboundRes, stayRes }) => {
        this.isLoading = false

        if (this.hasInbound) {
          const parsed = this.parseRoomOccupants(inboundRes)
          this.inboundMembers = this.dedupeByMobile(parsed.members)
          if (!parsed.ok) console.warn('Inbound members API issue:', parsed.message)
        }

        if (this.hasStay) {
          const parsed = this.parseRoomOccupants(stayRes)
          this.stayMembers = this.dedupeByMobile(parsed.members)
          if (!parsed.ok) console.warn('Stay members API issue:', parsed.message)
        }

        if (this.totalMembers === 0) {
          this.errorMessage = 'No members found for these rooms yet.'
        }
      },
      error: () => {
        this.isLoading = false
        this.errorMessage = 'Unable to load room members. Please try again later.'
      },
    })
  }

  private parseRoomOccupants(
    res: RoomOccupantsResponse | null
  ): { ok: boolean; members: RoomMember[]; message: string } {
    if (!res) return { ok: false, members: [], message: 'No response' }

    const ok =
      String(res.code) === '200' ||
      String(res.status) === '200' ||
      res.status === 'OK' ||
      res.status === 'Success'

    const list =
      (res.details as { fullName?: string; mobile?: string }[]) ??
      (res.occupants as { fullName?: string; mobile?: string }[]) ??
      []

    const members = Array.isArray(list)
      ? list.map((o) => ({
          fullName: (o.fullName || '').trim() || 'Unnamed Member',
          mobile: (o.mobile || '').trim() || '-',
        }))
      : []

    return { ok: !!ok, members, message: res.message || '' }
  }

  private dedupeByMobile(members: RoomMember[]): RoomMember[] {
    const seen = new Set<string>()
    const out: RoomMember[] = []
    for (const m of members || []) {
      const key = (m.mobile || '').trim() || `${m.fullName}`.trim()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(m)
    }
    return out
  }

  private errMsg(e: any): string {
    // nice readable message in logs
    const status = e?.status
    const msg = e?.message || 'Request failed'
    return status ? `${msg} (HTTP ${status})` : msg
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
