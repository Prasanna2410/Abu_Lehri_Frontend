import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.auth.getLoggedInUserDetailsAsync()).pipe(
      switchMap((user) => {
        const token = user?.jwtToken;
        if (!token) return next.handle(req);

        return next.handle(
          req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        );
      })
    );
  }
}
