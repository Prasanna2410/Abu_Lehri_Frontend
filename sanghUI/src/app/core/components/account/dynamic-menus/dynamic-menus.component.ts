import { Component } from '@angular/core';

interface MenuItem {
  pageName: string;
  displayName: string;
  icon?: string; // optional field for icons
}

@Component({
  selector: 'app-dynamic-menus',
  templateUrl: './dynamic-menus.component.html',
  styleUrls: ['./dynamic-menus.component.css']
})
export class DynamicMenusComponent {
  resourceNames: MenuItem[] = [];

  constructor() {}

  ngOnInit(): void {
    // Hardcoded menu items
    this.resourceNames = [
      { pageName: 'dashboard', displayName: 'Dashboard', icon: 'fa-solid fa-gauge' },
      { pageName: 'useraccount', displayName: 'User Accounts', icon: 'fa-solid fa-users' },
      { pageName: 'logout', displayName: 'Logout', icon: 'fa-solid fa-right-from-bracket' }
    ];
  }
}
