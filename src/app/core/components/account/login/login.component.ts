// src/app/pages/login/login.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { LoginUserRequest } from 'src/app/models/login-request.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  submitted = false;
  invalidMsg = '';

  frmValidate = this.fb.group({
    username: ['', [Validators.required]],
    password: [''] // optional – if blank, use username as password
  });

  private loginSub?: Subscription;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  get f() { return this.frmValidate.controls; }

  // ✅ IMPORTANT: if token exists, don't show login again
  async ngOnInit(): Promise<void> {
    try {
      const ok = await this.authService.isAuthenticatedAsync();
      if (ok) {
        // change this route if your dashboard route is different
        this.router.navigateByUrl('/dashboard');
      }
    } catch (e) {
      // ignore
    }
  }

  onLoginUser(): void {
    this.submitted = true;
    this.invalidMsg = '';

    if (this.frmValidate.invalid) {
      this.invalidMsg = 'Please enter Mobile Number';
      return;
    }

    const username = (this.f['username'].value || '').toString().trim();
    const password = (this.f['password'].value || username).toString().trim();

    const payload: LoginUserRequest = { username, password };

    this.loginSub = this.authService.loginUser(payload).subscribe({
      next: (res: any) => {
        if (!res || res.statusCode !== '200') {
          this.invalidMsg = res?.message || 'Invalid mobile or password';
          return;
        }

        // ✅ DO NOT store sessionStorage here
        // AuthService.loginUser() already saves jwtToken + user details to Capacitor Preferences (persistent)
        // and mirrors to sessionStorage if needed.

        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        console.error('Login error', err);
        this.invalidMsg =
          err?.error?.message ||
          err?.error?.msg ||
          'Unable to login. Please check your mobile number/password.';
      }
    });
  }

  onReset(): void {
    this.submitted = false;
    this.invalidMsg = '';
    this.frmValidate.reset();
  }

  ngOnDestroy(): void {
    this.loginSub?.unsubscribe();
  }
}
