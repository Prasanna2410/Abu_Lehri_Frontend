import { Component } from '@angular/core'
import { Router } from '@angular/router'

type PatrikaPhoto = {
  src: string
  title: string
  subtitle?: string
}

@Component({
  selector: 'app-patrika-lekhan',
  templateUrl: './patrika-lekhan.component.html',
  styleUrls: ['./patrika-lekhan.component.css'],
})
export class PatrikaLekhanComponent {
  constructor(private router: Router) {}

  // ✅ Update these image paths as per your assets folder
  photos: PatrikaPhoto[] = [
    {
      src: '/assets/images/patrika1.jpeg',
      title: '21st DECEMBER · PATRIKA LEKHAN',
      subtitle: 'Creativity & Devotion',
    },
    {
      src: '/assets/images/patrika2.jpeg',
      title: '21st DECEMBER · PATRIKA LEKHAN',
      subtitle: 'Sangh Moments',
    },
    {
      src: '/assets/images/patrika3.jpeg',
      title: '21st DECEMBER · PATRIKA LEKHAN',
      subtitle: 'Writing & Inspiration',
    },
    {
      src: '/assets/images/patrika4.jpeg',
      title: '21st DECEMBER · PATRIKA LEKHAN',
      subtitle: 'Memories Together',
    },
  ]

  activePhoto: PatrikaPhoto | null = null

  // ✅ Your Kwikpic link
  moreImagesLink = 'https://kwikpic-in.app.link/e/TDiYe0hMuZb?uCode=BWIC4K'

  goBack() {
    this.router.navigate(['/events'])
  }

  open(photo: PatrikaPhoto) {
    this.activePhoto = photo
  }

  close() {
    this.activePhoto = null
  }

  openMoreImages() {
    window.open(this.moreImagesLink, '_blank')
  }
}
