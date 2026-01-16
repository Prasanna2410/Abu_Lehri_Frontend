// src/app/pages/mumbai-events/mumbai-events.component.ts
import { Component } from '@angular/core'
import { Router } from '@angular/router'

type MumbaiEventPhoto = {
  src: string
  title: string
  subtitle?: string
}

@Component({
  selector: 'app-mumbai-events',
  templateUrl: './mumbai-events.component.html',
  styleUrls: ['./mumbai-events.component.css'],
})
export class MumbaiEventsComponent {
  constructor(private router: Router) {}

  // ✅ Update these image paths as per your assets folder
  photos: MumbaiEventPhoto[] = [
    {
      src: '/assets/images/mum1.jpeg',
      title: '27th JULY · MUMBAI',
      subtitle: 'Sangh Gathering & Bhakti',
    },
    {
      src: '/assets/images/mum2.jpeg',
      title: '27th JULY · MUMBAI',
      subtitle: 'Swadhyay & Pravachan',
    },
    {
      src: '/assets/images/mum3.jpeg',
      title: '27th JULY · MUMBAI',
      subtitle: 'Aarti & Mahotsav Moments',
    },
    {
      src: '/assets/images/mum4.jpeg',
      title: '27th JULY · MUMBAI',
      subtitle: 'Blessings & Memories',
    },
  ]

  activePhoto: MumbaiEventPhoto | null = null

  // ✅ Your "View More Images" link
  moreImagesLink =
    'https://kwikpic-in.app.link/lkxiwnub2Yb?groupCode=KNDGKH'

  goBack() {
    this.router.navigate(['/events'])
  }

  open(photo: MumbaiEventPhoto) {
    this.activePhoto = photo
  }

  close() {
    this.activePhoto = null
  }

  openMoreImages() {
    window.open(this.moreImagesLink, '_blank')
  }
}
