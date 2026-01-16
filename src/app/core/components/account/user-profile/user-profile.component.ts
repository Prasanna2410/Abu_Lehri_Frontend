import { Component, OnInit } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { Location } from '@angular/common'

interface UserProfileApiResponse {
  userid?: number
  firstName?: string
  middleName?: string
  lastName?: string
  mobileNumber?: string
  profilePhotoUrl?: string | null
  profilePhoto?: string | null
}

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
})
export class UserProfileComponent implements OnInit {
  loading = false
  errorMessage = ''

  mobileNumber = ''
  fullName = ''
  initials = 'JJ'
  profilePhotoUrl: string | null = null

  // ✅ Use your backend base URL for LOCAL
  private API_BASE = 'https://api.shreesanghutsav.com'

  constructor(
    private http: HttpClient,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    const raw = sessionStorage.getItem('UserDetails')
    if (!raw) {
      this.router.navigate(['/login'])
      return
    }

    try {
      const user = JSON.parse(raw)
      this.mobileNumber = user?.username || ''
      if (!this.mobileNumber) {
        this.router.navigate(['/login'])
        return
      }
    } catch {
      this.router.navigate(['/login'])
      return
    }

    this.loadProfile()
  }

  loadProfile() {
    this.loading = true
    this.errorMessage = ''

    const mobile = this.normalizeMobile(this.mobileNumber)
    const url = `${this.API_BASE}/api/profile/user/${mobile}`

    this.http.get<UserProfileApiResponse>(url).subscribe({
      next: (res) => {
        const name = this.buildFullName(res)
        this.fullName = name || 'User'
        this.initials = this.getInitials(this.fullName)

        // ✅ if backend sends profilePhotoUrl, use it
        if (res?.profilePhotoUrl) {
          this.profilePhotoUrl = this.noCache(res.profilePhotoUrl)
        } else if (res?.profilePhoto) {
          // ✅ fallback if backend sends filename only
          this.profilePhotoUrl = this.noCache(`${this.API_BASE}/api/profile/photo/${res.profilePhoto}`)
        } else {
          this.profilePhotoUrl = null
        }

        this.loading = false
      },
      error: (err) => {
        console.log('Profile load failed', err)
        this.errorMessage = 'Failed to load profile. Please try again.'
        this.loading = false
      },
    })
  }

  openFilePicker(input: HTMLInputElement) {
    input.click()
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const file = input.files[0]
    input.value = '' // ✅ allow selecting same file again

    // quick validations
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select an image file.'
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Image is too large. Max 10MB.'
      return
    }

    this.uploadPhoto(file)
  }

  uploadPhoto(file: File) {
    this.loading = true
    this.errorMessage = ''

    const mobile = this.normalizeMobile(this.mobileNumber)
    const url = `${this.API_BASE}/api/profile/user/${mobile}/photo`

    const formData = new FormData()
    formData.append('file', file)

    this.http.post<UserProfileApiResponse>(url, formData).subscribe({
      next: (res) => {
        // After upload, refresh UI
        const name = this.buildFullName(res)
        this.fullName = name || this.fullName || 'User'
        this.initials = this.getInitials(this.fullName)

        if (res?.profilePhotoUrl) {
          this.profilePhotoUrl = this.noCache(res.profilePhotoUrl)
        } else if (res?.profilePhoto) {
          this.profilePhotoUrl = this.noCache(`${this.API_BASE}/api/profile/photo/${res.profilePhoto}`)
        } else {
          // If backend didn't return it, fallback to re-fetch
          this.loadProfile()
          return
        }

        this.loading = false
      },
      error: (err) => {
        console.log('Upload failed', err)
        this.errorMessage = 'Upload failed. Please try again.'
        this.loading = false
      },
    })
  }

  // If image 404 or error, fallback to initials
  onImgError() {
    this.profilePhotoUrl = null
  }

  /**
   * ✅ Back that works everywhere (Android + iOS + Capacitor)
   * - if history exists => back
   * - else => go to dashboard
   */
  goBack(event?: Event) {
    if (event) event.stopPropagation()
    const hasHistory = window.history.length > 1
    if (hasHistory) this.location.back()
    else this.router.navigate(['/dashboard'])
  }

  private buildFullName(res: UserProfileApiResponse): string {
    const parts = [
      (res?.firstName || '').trim(),
      (res?.middleName || '').trim(),
      (res?.lastName || '').trim(),
    ].filter(Boolean)
    return parts.join(' ').trim()
  }

  private getInitials(name: string): string {
    if (!name) return 'JJ'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    const first = parts[0]?.[0] || ''
    const last = parts[parts.length - 1]?.[0] || ''
    return (first + last).toUpperCase() || 'JJ'
  }

  private normalizeMobile(mobile: string): string {
    if (!mobile) return ''
    let digits = mobile.replace(/\D/g, '')
    if (digits.length > 10) digits = digits.substring(digits.length - 10)
    return digits
  }

  // ✅ prevent caching after upload
  private noCache(url: string): string {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}t=${Date.now()}`
  }
}
