import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Task {
  name: string;
  completed: boolean;
  points: number;
}

@Component({
  selector: 'app-daily-tasks',
  templateUrl: './daily-tasks.component.html',
  styleUrls: ['./daily-tasks.component.css']
})
export class DailyTasksComponent implements OnInit {
 tasks: Task[] = [
  { name: 'पादविहारी - स्वस्थ जीवन यात्रा', completed: false, points: 10 },
  { name: 'भूमि संवरी - प्राकृतिक विश्राम', completed: false, points: 10 },
  { name: 'ब्रह्मचारी - संयमित जीवन', completed: false, points: 10 },
  { name: 'सचित्ताहारी - सात्विक आहार', completed: false, points: 10 },
  { name: 'फलाहारी - प्राकृतिक पोषण', completed: false, points: 10 },
  { name: 'आवश्यकतावादी - सरल जीवन', completed: false, points: 10 },
  { name: 'प्रतिक्रमण - आत्मशुद्धि साधना', completed: false, points: 10 }
];

totalPossible = 70;  // 7 tasks × 10 points
  earnedPoints = 0;
  streak = 5;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadProgress();
    this.updatePoints();
  }

  goBackToDashboard(): void {
    this.router.navigateByUrl('/dashboard');
  }

  updatePoints(): void {
    this.earnedPoints = this.tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + task.points, 0);
  }

  get anyTaskCompleted(): boolean {
    return this.tasks.some(task => task.completed);
  }

  submitTasks(): void {
    localStorage.setItem('dailyTasks', JSON.stringify(this.tasks));
    localStorage.setItem('earnedPoints', this.earnedPoints.toString());
    localStorage.setItem('lastSubmitDate', new Date().toDateString());

    alert(`Submitted! You earned ${this.earnedPoints} points today!`);

    // ✅ Hard refresh (reload the whole webview)
    window.location.reload();
  }

  loadProgress(): void {
    const lastSubmitDate = localStorage.getItem('lastSubmitDate');
    const today = new Date().toDateString();

    if (lastSubmitDate !== today) {
      this.tasks.forEach(task => (task.completed = false));
      this.earnedPoints = 0;
      return;
    }

    const saved = localStorage.getItem('dailyTasks');
    if (saved) {
      const savedTasks = JSON.parse(saved);
      this.tasks.forEach((task, index) => {
        if (savedTasks[index]) {
          task.completed = !!savedTasks[index].completed;
        }
      });
    }
  }
}
