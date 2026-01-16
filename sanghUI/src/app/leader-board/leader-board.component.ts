import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  isCurrentUser?: boolean;
  avatar?: string;
}

@Component({
  selector: 'app-leader-board',
  templateUrl: './leader-board.component.html',
  styleUrls: ['./leader-board.component.css']
})
export class LeaderBoardComponent implements OnInit {

  constructor(private location: Location) {}

  currentUser: LeaderboardEntry = {
    rank: 68,
    name: 'PINKI',
    points: 120,
    isCurrentUser: true
  };

  topMembers: LeaderboardEntry[] = [
    { rank: 1, name: 'Rajesh Kumar', points: 450 },
    { rank: 2, name: 'Priya Sharma', points: 420 },
    { rank: 3, name: 'Amit Patel', points: 395 },
    { rank: 4, name: 'Sunita Devi', points: 380 },
    { rank: 5, name: 'Vikram Singh', points: 365 },
    { rank: 6, name: 'Meena Jain', points: 350 },
    { rank: 7, name: 'Rahul Agarwal', points: 340 },
    { rank: 8, name: 'Anita Gupta', points: 325 },
    { rank: 9, name: 'Suresh Mehta', points: 310 },
    { rank: 10, name: 'Kavita Shah', points: 295 }
  ];

  ngOnInit(): void {}

  /** BACK BUTTON FIX */
  goBack(): void {
    this.location.back();
  }

  getMedalIcon(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }
}
