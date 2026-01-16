// src/app/pages/pune-events/pune-events.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

type PuneEventPhoto = {
  src: string;
  title: string;
  subtitle?: string;
};

@Component({
  selector: 'app-pune-events',
  templateUrl: './pune-events.component.html',
  styleUrls: ['./pune-events.component.css'],
})
export class PuneEventsComponent {
  constructor(private router: Router) {}

  // ✅ Update these image paths as per your assets folder
  photos: PuneEventPhoto[] = [
    {
      src: '/assets/images/pune1.jpeg',
      title: '10th AUGUST · PUNE',
      subtitle: 'Sangh Gathering & Bhakti',
    },
    {
      src: '/assets/images/pune2.jpeg',
      title: '10th AUGUST · PUNE',
      subtitle: 'Swadhyay & Pravachan',
    },
    {
      src: '/assets/images/pune3.jpeg',
      title: '10th AUGUST · PUNE',
      subtitle: 'Aarti & Mahotsav Moments',
    },
    {
      src: '/assets/images/pune4.jpeg',
      title: '10th AUGUST · PUNE',
      subtitle: 'Blessings & Memories',
    },
  ];

  activePhoto: PuneEventPhoto | null = null;

  // ✅ Pune album link
  moreImagesLink =
    'https://kwikpic-in.app.link/ab9EhVi81Yb?groupCode=UXMHAZ';

  goBack() {
    this.router.navigate(['/events']);
  }

  open(photo: PuneEventPhoto) {
    this.activePhoto = photo;
  }

  close() {
    this.activePhoto = null;
  }

  openMoreImages() {
    window.open(this.moreImagesLink, '_blank');
  }
}
