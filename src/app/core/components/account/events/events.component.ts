import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'

interface YatraEventApiDto {
  dayNumber: number
  title: string
  hindiDate: string
  gregorianDate: string // "2026-01-26"
  distanceKm?: number | null
  icon?: string | null
  badgeColor?: string | null
  gradientBg?: string | null
}

interface YatraEvent {
  day: number
  dayHindi: string
  title: string
  titleHtml?: string
  date: string // dd.MM.yyyy (matches schedulesByDate keys)
  dateHindi: string
  distance: string
  icon: string
  color: string
  gradient: string
  iconBg: string
  route?: string
}

interface DayScheduleItem {
  time: string
  meridiem: string
  title: string
}

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.css'],
})
export class EventsComponent implements OnInit {
  private API_BASE = 'https://registration.lehriratnasangh.live' // ✅ change to prod: https://registration.lehriratnasangh.live

  loading = false
  errorMessage = ''

  previousEvents: YatraEvent[] = []

  // ✅ FALLBACK (your same list)
  private fallbackEvents: YatraEvent[] = [
    {
      day: 1,
      dayHindi: 'दि. 26.1.2026',
      title: 'गुरु प्रवेश/ जेंडा वंदन',
      date: '26.01.2026',
      dateHindi: ' सोमवार दि. 26.1.2026',
      distance: '—',
      icon: '🛕',
      color: '#f97316',
      gradient:
        'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,179,8,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,179,8,0.35))',
    },
    {
      day: 2,
      dayHindi: 'दि. 27.1.2026',
      title: 'श्री जीरावला पार्श्वनाथ महापूजन',
      date: '27.01.2026',
      dateHindi: 'मंगलवार, दि. 27.1.2026',
      distance: '—',
      icon: '🙏',
      color: '#10b981',
      gradient:
        'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.35))',
    },
    {
      day: 3,
      dayHindi: 'दि. 28.1.2026',
      title: 'मातृ-पितृ वंदना ',
      date: '28.01.2026',
      dateHindi: 'बुधवार, दि. 28.1.2026',
      distance: '—',
      icon: '🕉️',
      color: '#8b5cf6',
      gradient:
        'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(124,58,237,0.35))',
    },
    {
      day: 4,
      dayHindi: 'दि. 29.1.2026',
      title: 'श्री जीरावला से वरमाण तीर्थ (7 कि.मी.)',
      date: '29.01.2026',
      dateHindi: 'गुरुवार, दि. 29.1.2026',
      distance: '7 कि.मी.',
      icon: '🚶',
      color: '#ec4899',
      gradient:
        'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(190,24,93,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(190,24,93,0.35))',
    },
    {
      day: 5,
      dayHindi: 'दि. 30.1.2026',
      title: 'रेवदर (10 कि.मी.)',
      date: '30.01.2026',
      dateHindi: 'शुक्रवार, दि. 30.01.2026',
      distance: '10 कि.मी.',
      icon: '🌄',
      color: '#3b82f6',
      gradient:
        'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.35))',
    },
    {
      day: 6,
      dayHindi: 'दि. 31.1.2026',
      title: 'दंताणी तीर्थ (10 कि.मी.)',
      date: '31.01.2026',
      dateHindi: 'शनिवार, दि. 31.01.2026',
      distance: '10 कि.मी.',
      icon: '⛰️',
      color: '#6366f1',
      gradient:
        'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(79,70,229,0.35))',
    },
    {
      day: 7,
      dayHindi: 'दि. 01.02.2026',
      title: 'भेरुतारक तीर्थ (15 कि.मी.)',
      date: '01.02.2026',
      dateHindi: 'रविवार, दि. 01.02.2026',
      distance: '15 कि.मी.',
      icon: '🛤️',
      color: '#f97316',
      gradient:
        'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,179,8,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,179,8,0.35))',
    },
    {
      day: 8,
      dayHindi: 'दि. 02.02.2026',
      title: 'श्री अर्बुद्ध गिरीराज महातीर्थ (8 कि.मी.)',
      date: '02.02.2026',
      dateHindi: 'सोमवार, दि. 02.02.2026',
      distance: '8 कि.मी.',
      icon: '🏔️',
      color: '#10b981',
      gradient:
        'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.35))',
    },
    {
      day: 9,
      dayHindi: 'दि. 03.02.2026',
      title: 'श्री अर्बुद्ध गिरीराज महातीर्थ',
      date: '03.02.2026',
      dateHindi: 'मंगलवार, दि. 03.02.2026',
      distance: '—',
      icon: '🌟',
      color: '#8b5cf6',
      gradient:
        'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.18) 100%)',
      iconBg:
        'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(124,58,237,0.35))',
    },
  ]

  events: YatraEvent[] = []

  // ✅ keep your schedulesByDate exactly as you already have (unchanged)
  schedulesByDate: { [date: string]: DayScheduleItem[] } = {
    // ... paste your existing schedulesByDate exactly ...
  }

  popupSubtitleByDate: { [date: string]: string } = {
    // ... paste your existing popupSubtitleByDate exactly ...
  }

  activeScheduleItems: DayScheduleItem[] = []
  activeEvent: YatraEvent | null = null

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.previousEvents = this.previousEvents.map((e) => this.withTitleHtml(e))
    this.loadEventsFromDb()
  }

  private loadEventsFromDb(): void {
    this.loading = true
    this.errorMessage = ''

    this.http.get<YatraEventApiDto[]>(`${this.API_BASE}/api/yatra/events`).subscribe({
      next: (rows) => {
        if (!rows || rows.length === 0) {
          this.events = this.fallbackEvents.map((e) => this.withTitleHtml(e))
          this.loading = false
          return
        }

        this.events = rows
          .map((r) => this.mapApiToUi(r))
          .map((e) => this.withTitleHtml(e))

        this.loading = false
      },
      error: (err) => {
        console.log('Failed to load events from server', err)
        this.events = this.fallbackEvents.map((e) => this.withTitleHtml(e))
        this.errorMessage = 'Failed to load events from server. Showing offline data.'
        this.loading = false
      },
    })
  }

  private mapApiToUi(r: YatraEventApiDto): YatraEvent {
    const date = this.isoToDdMmYyyy(r.gregorianDate)
    const distance = r.distanceKm ? `${r.distanceKm} कि.मी.` : '—'
    const color = r.badgeColor || '#2563eb'
    const gradient =
      r.gradientBg ||
      'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.18))'

    return {
      day: r.dayNumber,
      dayHindi: `दि. ${date}`,
      title: r.title,
      date,
      dateHindi: r.hindiDate || date,
      distance,
      icon: r.icon || '🛕',
      color,
      gradient,
      iconBg: `linear-gradient(135deg, ${this.hexToRgba(color, 0.28)}, ${this.hexToRgba(color, 0.38)})`,
    }
  }

  private isoToDdMmYyyy(iso: string): string {
    // "2026-01-26" => "26.01.2026"
    if (!iso) return ''
    const parts = iso.split('-')
    if (parts.length !== 3) return iso
    return `${parts[2]}.${parts[1]}.${parts[0]}`
  }

  private withTitleHtml(e: YatraEvent): YatraEvent {
    return { ...e, titleHtml: this.toTitleHtml(e.title) }
  }

  private toTitleHtml(title: string): string {
    return (title || '').replace(/\n/g, '<br/>')
  }

  private hexToRgba(hex: string, alpha: number): string {
    if (!hex || !hex.startsWith('#') || hex.length !== 7) {
      return `rgba(37,99,235,${alpha})`
    }
    const r = parseInt(hex.substring(1, 3), 16)
    const g = parseInt(hex.substring(3, 5), 16)
    const b = parseInt(hex.substring(5, 7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  goBack(): void {
    this.router.navigate(['/dashboard'])
  }

  getTotalDistance(): number {
    return this.events
      .filter((e) => e.distance.includes('कि.मी.'))
      .reduce((sum, e) => sum + (parseInt(e.distance, 10) || 0), 0)
  }

  getTotalTirth(): number {
    const tirthSet = new Set<string>()
    this.events.forEach((event) => {
      const matches = event.title.match(/[^\s]+तीर्थ/g)
      if (matches) matches.forEach((t) => tirthSet.add(t))
    })
    return tirthSet.size
  }

  onEventClick(event: YatraEvent): void {
    if (event.route) {
      this.router.navigate(['/', event.route])
      return
    }

    const sched = this.schedulesByDate[event.date]
    if (sched && sched.length > 0) {
      this.activeEvent = this.withTitleHtml(event)
      this.activeScheduleItems = sched
    }
  }

  closeSchedule(): void {
    this.activeEvent = null
    this.activeScheduleItems = []
  }

  getPopupSubtitle(): string {
    if (!this.activeEvent) return ''
    return this.popupSubtitleByDate[this.activeEvent.date] || this.activeEvent.dateHindi
  }
}
