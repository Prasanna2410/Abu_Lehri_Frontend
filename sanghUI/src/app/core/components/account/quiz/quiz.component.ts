import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from 'src/app/services/quiz.service';
import { HttpClient } from '@angular/common/http';

interface Question {
  questionId: number;
  sessionQuestionId: number;
  orderNo: number;
  question: string;
  options: string[];
  points: number;
  icon?: string;
  isCorrect?: boolean;
}

interface TodayStatusResponse {
  code: string;
  message: string;
  data: {
    open: boolean;
  };
}

interface TodayScoreResponse {
  code: string;
  message: string;
  data: {
    submitted: boolean;
    points: number;
  };
}

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit {

  /** USER + QUIZ INFO */
  userId = 1; // later from JWT
  category = 'SPIRITUAL';

  /** SESSION */
  sessionId!: number;

  /** QUESTIONS */
  questions: Question[] = [];
  currentQuestionIndex = 0;
  currentQuestion!: Question;

  /** UI STATE */
  selectedOption: string | null = null;
  showResult = false;
  showResults = false;

  earnedPoints = 0;
  correctAnswers = 0;

  isSubmitting = false;
  quizFinished = false;

  /** 🔒 QUIZ STATES */
  quizClosed = false;
  alreadySubmitted = false;
  submittedPoints = 0;

  private baseUrl = 'http://192.168.1.46:8080/api/quiz';

  constructor(
    private quizService: QuizService,
    private http: HttpClient,
    private router: Router
  ) {}

  /** ENTRY POINT */
  ngOnInit(): void {
    this.checkQuizOpenStatus();
  }

  /** 1️⃣ CHECK QUIZ OPEN */
  checkQuizOpenStatus(): void {
    this.http.get<TodayStatusResponse>(`${this.baseUrl}/today/status`)
      .subscribe(res => {
        if (!res.data.open) {
          this.quizClosed = true;
        } else {
          this.checkUserSubmission();
        }
      });
  }

  /** 2️⃣ CHECK USER SUBMISSION */
  checkUserSubmission(): void {
    this.http.get<TodayScoreResponse>(`${this.baseUrl}/${this.userId}/score/today`)
      .subscribe(res => {
        if (res.data?.submitted) {
          this.alreadySubmitted = true;
          this.submittedPoints = res.data.points || 0;
        } else {
          this.startQuiz();
        }
      });
  }

  /** 3️⃣ START QUIZ */
  startQuiz(): void {
    this.quizService.startQuiz(this.userId, this.category)
      .subscribe(res => {
        this.sessionId = res.sessionId;

        this.questions = res.questions.map((q: any, index: number) => ({
          questionId: q.questionId,
          sessionQuestionId: q.sessionQuestionId,
          orderNo: q.orderNo,
          question: q.questionText,
          options: q.options,
          points: q.points,
          icon: this.getIconByIndex(index)
        }));

        this.currentQuestionIndex = 0;
        this.loadQuestion();
      });
  }

  /** LOAD QUESTION */
  loadQuestion(): void {
    this.currentQuestion = this.questions[this.currentQuestionIndex];
    this.selectedOption = null;
    this.showResult = false;
  }

  /** SUBMIT ANSWER */
  selectOption(option: string): void {
    if (this.showResult || this.quizFinished) return;

    this.selectedOption = option;
    this.showResult = true;

    const chosenIndex = this.currentQuestion.options.indexOf(option);

    this.quizService.submitAnswer(this.userId, {
      sessionId: this.sessionId,
      questionId: this.currentQuestion.questionId,
      chosenIndex
    }).subscribe(res => {
      this.currentQuestion.isCorrect = res.data.isCorrect;
      if (res.data.isCorrect) {
        this.earnedPoints += this.currentQuestion.points;
        this.correctAnswers++;
      }
    });
  }

  /** NEXT QUESTION */
  nextQuestion(): void {
    if (this.quizFinished) return;
    this.currentQuestionIndex++;
    this.loadQuestion();
  }

  /** FINAL SUBMIT */
  submitQuiz(): void {
    if (this.isSubmitting || this.quizFinished) return;

    this.isSubmitting = true;

    this.quizService.finishQuiz(this.userId, this.sessionId)
      .subscribe(res => {
        this.quizFinished = true;
        this.earnedPoints = res.data?.finalPoints ?? this.earnedPoints;
        this.showResults = true;
        this.isSubmitting = false;
      }, () => {
        this.isSubmitting = false;
      });
  }

  /** ✅ REQUIRED BY HTML */
  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  /** ✅ REQUIRED BY HTML */
  getOptionLetter(option: string): string {
    return String.fromCharCode(65 + this.currentQuestion.options.indexOf(option));
  }

  /** ✅ REQUIRED BY HTML */
  get totalPossiblePoints(): number {
    return this.questions.reduce((sum, q) => sum + q.points, 0);
  }

  /** NAVIGATION */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /** ICON MAPPER */
  private getIconByIndex(index: number): string {
    const icons = [
      'fas fa-heart',
      'fas fa-pray',
      'fas fa-scroll',
      'fas fa-star',
      'fas fa-birthday-cake',
      'fas fa-eye'
    ];
    return icons[index % icons.length];
  }
}
