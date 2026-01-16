import { Component } from '@angular/core'
import { Router } from '@angular/router'

type JainConcertPhoto = {
  src: string
  title: string
  subtitle?: string
}

@Component({
  selector: 'app-jain-concert',
  templateUrl: './jain-concert.component.html',
  styleUrls: ['./jain-concert.component.css'],
})
export class JainConcertComponent {
  constructor(private router: Router) {}

  // ✅ Update these image paths as per your assets folder
  photos: JainConcertPhoto[] = [
    {
      src: '/assets/images/concert1.jpeg',
      title: '21st DECEMBER · JAIN CONCERT',
      subtitle: 'Bhakti & Music',
    },
    {
      src: '/assets/images/concert2.jpeg',
      title: '21st DECEMBER · JAIN CONCERT',
      subtitle: 'Joyful Moments',
    },
    {
      src: '/assets/images/concert3.jpeg',
      title: '21st DECEMBER · JAIN CONCERT',
      subtitle: 'Sangh Togetherness',
    },
    {
      src: '/assets/images/concert4.jpeg',
      title: '21st DECEMBER · JAIN CONCERT',
      subtitle: 'Memories Forever',
    },
  ]

  activePhoto: JainConcertPhoto | null = null

  // ✅ Paste Jain Concert Kwikpic link here (like Mumbai/Patrika)
  moreImagesLink = 'PASTE_JAIN_CONCERT_KWIKPIC_LINK_HERE'

  goBack() {
    this.router.navigate(['/events'])
  }

  open(photo: JainConcertPhoto) {
    this.activePhoto = photo
  }

  close() {
    this.activePhoto = null
  }

  openMoreImages() {
    // if link not set, do nothing silently
    if (!this.moreImagesLink || this.moreImagesLink.includes('PASTE_')) return
    window.open(this.moreImagesLink, '_blank')
  }
}
