import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuizService {

  private BASE_URL = 'https://registration.lehriratnasangh.live/api/quiz';

  constructor(private http: HttpClient) {}

  startQuiz(userId: number, category: string): Observable<any> {
    return this.http.post(
      `${this.BASE_URL}/${userId}/start/${category}`,
      {}
    );
  }

  getSessionQuestions(userId: number, sessionId: number): Observable<any> {
    return this.http.get(
      `${this.BASE_URL}/${userId}/session/${sessionId}/questions`
    );
  }

  submitAnswer(userId: number, payload: any): Observable<any> {
    return this.http.post(
      `${this.BASE_URL}/${userId}/answer`,
      payload
    );
  }

  finishQuiz(userId: number, sessionId: number): Observable<any> {
    return this.http.post(
      `${this.BASE_URL}/${userId}/finish/${sessionId}`,
      {}
    );
  }
}
