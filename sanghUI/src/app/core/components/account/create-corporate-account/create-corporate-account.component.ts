import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RegisterUserRequest } from 'src/app/models/register-user-request.model';
import { userSessionDetails } from 'src/app/models/user-session-responce.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-personal-information',
  templateUrl: './create-corporate-account.component.html',
  styleUrls: ['./create-corporate-account.component.css']
})
export class CreateCorporateAccountComponent implements OnInit, OnDestroy {
  submitted = false;
  registerUserRequest!: RegisterUserRequest;
  userSessionDetails: userSessionDetails | null | undefined;
  frmValidate: FormGroup;
  registerUserSubscription?: Subscription;
  modalDisplayStyle = 'none';
  userMessage = '';

  constructor(private authService: AuthService, private fv: FormBuilder, private router: Router) {
    this.frmValidate = this.fv.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      middleName: ['', [Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      gender: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required]],
      pinCode: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^[0-9]{6}$')]],
      mobileNumber: ['', [Validators.required, Validators.minLength(10), Validators.pattern('^[0-9]{10}$')]],
      whatsappNumber: ['', [Validators.pattern('^[0-9]{10}$')]],
      emergencyNumber: ['', [Validators.pattern('^[0-9]{10}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
      idProofType: ['', [Validators.required]],
      idProofNumber: ['', [Validators.required]],
      idProofPath: ['', [Validators.required]],
      corpoName: ['', [Validators.required, Validators.minLength(3)]],
      branch: ['', [Validators.required, Validators.minLength(3)]],
      landlineNumber: ['', [Validators.pattern('^[0-9]{10}$')]],
      userType: [3], // Corporate account
      noOfMembers: [0],
      memberRelation: [''],
      daysAttending: [''],
      accommodationRequired: [''],
      mealsRequired: [''],
      healthProblem: ['', [Validators.maxLength(255)]],
      remarks: ['', [Validators.maxLength(255)]],
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

  onCreateCorporateAccount() {
    this.submitted = true;
    if (this.frmValidate.valid) {
      const formData = new FormData();
      const user: RegisterUserRequest = {
        ...this.frmValidate.value,
        userType: 3,
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
          console.log('Corporate account created:', response);
          this.userMessage = 'Corporate account created successfully!';
          this.modalDisplayStyle = 'block';
          this.onReset();
        },
        error: (error) => {
          console.error('Error creating corporate account:', error);
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
      userType: 3,
      noOfMembers: 0,
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
    this.router.navigate(['corporateaccount']);
  }
}