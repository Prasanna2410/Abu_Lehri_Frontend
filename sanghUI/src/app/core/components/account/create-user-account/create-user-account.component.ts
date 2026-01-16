import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RegisterUserRequest } from 'src/app/models/register-user-request.model';
import { userSessionDetails } from 'src/app/models/user-session-responce.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-user-information',
  templateUrl: './create-user-account.component.html',
  styleUrls: ['./create-user-account.component.css']
})
export class CreateUserAccountComponent implements OnInit, OnDestroy {
  submitted = false;
  userSessionDetails: userSessionDetails | null | undefined;
  frmValidate: FormGroup;
  registerUserSubscription?: Subscription;
  modalDisplayStyle = 'none';
  userMessage = '';

  constructor(private authService: AuthService, private fv: FormBuilder, private router: Router) {
    this.frmValidate = this.fv.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      middleName: ['', [Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]], // Removed required
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      gender: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required]],
      pinCode: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^[0-9]{6}$')]],
      mobileNumber: ['', [Validators.required, Validators.minLength(10), Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]], // Updated to require password
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]], // Added confirmPassword
      idProofPath: ['', [Validators.required]], // For file upload
      corpoName: ['none'],
      branch: ['none'],
      landlineNumber: ['0000000000'],
      userType: [5], // Normal/end user
      isActive: [true],
      isLocked: [false],
      createdBy: [''],
      createdDateTime: [new Date().toISOString()],
      updatedBy: [''],
      updatedDatetime: [new Date().toISOString()],
      eventId: ['default_event'],
      isSelected: [false]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.userSessionDetails = this.authService.getLoggedInUserDetails();
    if (this.userSessionDetails) {
      this.frmValidate.patchValue({
        createdBy: this.userSessionDetails.username,
        updatedBy: this.userSessionDetails.username
      });
    }
  }

  // Validator to check if password and confirm password match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get f(): { [key: string]: AbstractControl } {
    return this.frmValidate.controls;
  }

  // Handle file input changes
  onFileChange(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.frmValidate.get(controlName)?.setValue(input.files[0]);
    }
  }

  onCreateUserAccount() {
    this.submitted = true;
    if (this.frmValidate.valid) {
      const formData = new FormData();
      const user: RegisterUserRequest = {
        ...this.frmValidate.value,
        userType: 5,
        corpoName: 'none',
        branch: 'none',
        landlineNumber: '0000000000',
        isActive: true,
        isLocked: false,
        createdBy: this.frmValidate.value.email || this.userSessionDetails?.username || '',
        createdDateTime: new Date().toISOString(),
        updatedBy: this.frmValidate.value.email || this.userSessionDetails?.username || '',
        updatedDatetime: new Date().toISOString(),
        eventId: 'default_event',
        isSelected: false
      };

      // Append user data to FormData
      Object.entries(user).forEach(([key, value]) => {
        if (key === 'idProofPath') {
          return; // Skip idProofPath as it will be handled as idProofFile
        }
        if (key === 'dateOfBirth' && value) {
          formData.append(`users[0][${key}]`, new Date(value).toISOString());
        } else {
          formData.append(`users[0][${key}]`, value === null || value === undefined ? '' : value.toString());
        }
      });

      // Append file if present
      const idProofFile = this.frmValidate.get('idProofPath')?.value;
      if (idProofFile instanceof File) {
        formData.append(`users[0][idProofFile]`, idProofFile, idProofFile.name);
        formData.append(`users[0][idProofPath]`, idProofFile.name);
      }

      this.registerUserSubscription = this.authService.registerUser(formData).subscribe({
        next: (response) => {
          console.log('User account created:', response);
          this.userMessage = '';
          this.modalDisplayStyle = 'block';
          this.onReset();
        },
        error: (error) => {
          console.error('Error creating user account:', error);
          this.modalDisplayStyle = 'block';
          this.userMessage = error.error?.message || 'User already exists or an error occurred, please try again';
        }
      });
    } else {
      console.log('Form is invalid:', this.frmValidate.errors);
      console.log('Form values:', this.frmValidate.value);
    }
  }

  onReset(): void {
    this.submitted = false;
    this.frmValidate.reset({
      userType: 5,
      corpoName: 'none',
      branch: 'none',
      landlineNumber: '0000000000',
      isActive: true,
      isLocked: false,
      createdDateTime: new Date().toISOString(),
      updatedDatetime: new Date().toISOString(),
      eventId: 'default_event',
      isSelected: false
    });
  }

  ngOnDestroy(): void {
    this.registerUserSubscription?.unsubscribe();
  }

  closeModal(): void {
    this.modalDisplayStyle = 'none';
    if (!this.userMessage) {
      this.redirectToCorpList();
    }
  }

  openModal(): void {
    this.onReset();
    this.modalDisplayStyle = 'block';
  }

  redirectToCorpList(): void {
    this.router.navigate(['useraccount']);
  }
}