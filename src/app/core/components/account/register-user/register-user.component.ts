import { Component, OnDestroy, ChangeDetectorRef, NgZone, OnInit, AfterViewChecked } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { App } from '@capacitor/app';
import * as bootstrap from 'bootstrap';

interface RegisterUserRequest {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  address: string;
  city: string;
  pinCode: string;
  mobileNumber: string;
  email: string;
  password: string;
  whatsappNumber: string;
  emergencyNumber: string;
  idProofType: string;
  idProofNumber: string;
  idProofPath: string;
  memberRelation: string;
  daysAttending: string;
  accommodationRequired: string;
  mealsRequired: string;
  healthProblem: string;
  remarks: string;
  noOfMembers: number;
  active: boolean;
  locked: boolean;
  createdBy: string;
  createdDateTime: string;
  updatedBy: string;
  updatedDatetime: string;
  corpoName: string;
  branch: string;
  landlineNumber: string;
  userType: number;
  eventId: number;
  isSelected: boolean;
}

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.css']
})
export class RegisterUserComponent implements OnInit, OnDestroy, AfterViewChecked {
  submitted = false;
  currentSection = 1;
  model: RegisterUserRequest = {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    age: 0,
    address: '',
    city: '',
    pinCode: '',
    mobileNumber: '',
    email: '',
    password: '',
    whatsappNumber: '',
    emergencyNumber: '',
    idProofType: '',
    idProofNumber: '',
    idProofPath: '',
    memberRelation: '',
    daysAttending: '',
    accommodationRequired: '',
    mealsRequired: '',
    healthProblem: '',
    remarks: '',
    noOfMembers: 1,
    active: true,
    locked: false,
    createdBy: '',
    createdDateTime: '',
    updatedBy: '',
    updatedDatetime: '',
    corpoName: 'none',
    branch: 'none',
    landlineNumber: 'none',
    userType: 1,
    eventId: 0,
    isSelected: false
  };
  frmValidate: FormGroup;
  private registerUserSubscription?: Subscription;
  userMessage = '';
  familyMembers: number[] = [];
  fFamily: { [key: string]: AbstractControl | null }[] = [];
  isListening = false;
  isPaused = false;
  currentField: string = '';
  private timeoutId: any = null;
  private lastTapTime = 0;
  private readonly tapDebounceTime = 300;
  private lastResultTime = 0;
  private readonly resultDebounceTime = 500;
  selectedFiles: { [key: string]: File } = {};
  private modalInstance: bootstrap.Modal | null = null;
  private isSpeechAvailable = false;

  constructor(
    private authService: AuthService,
    private fv: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.frmValidate = this.fv.group({
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      middleName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]],
      gender: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required, this.dateNotInFutureValidator()]],
      address: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required]],
      pinCode: ['', [Validators.required, Validators.minLength(6), Validators.pattern('[0-9]{6}')]],
      mobileNumber: ['', [Validators.required, Validators.minLength(10), Validators.pattern('[0-9]{10}')]],
      whatsappNumber: ['', [Validators.pattern('[0-9]{10}')]],
      emergencyNumber: ['', [Validators.pattern('[0-9]{10}')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmPwd: ['', [Validators.required, Validators.minLength(4)]],
      idProofType: ['', [Validators.required]],
      idProofNumber: ['', [Validators.required]],
      idProofPath: ['', [Validators.required]],
      daysAttending: ['', [Validators.required]],
      accommodationRequired: ['', [Validators.required]],
      mealsRequired: ['', [Validators.required]],
      noOfMembers: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      healthProblem: ['', [Validators.maxLength(255)]],
      remarks: ['', [Validators.maxLength(255)]],
      isTermsAndCondtionAccepted: ['', [Validators.requiredTrue]]
    }, { validators: [this.passwordMatchValidator, this.noOfMembersValidator] });
  }

  // New method to check if Primary User section is invalid for "Next"
  isPrimarySectionInvalid(): boolean {
    const controls = this.frmValidate.controls;
    const primaryFields = [
      'firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'address', 'city',
      'pinCode', 'mobileNumber', 'whatsappNumber', 'emergencyNumber', 'email',
      'password', 'confirmPwd', 'idProofType', 'idProofNumber', 'idProofPath'
    ];
    return primaryFields.some(field => controls[field]?.invalid) ||
           !this.selectedFiles['idProofPath'] ||
           !(this.selectedFiles['idProofPath'] instanceof File);
  }

  // New method to check if Family Members section is invalid for "Next"
  isFamilySectionInvalid(): boolean {
    if (this.familyMembers.length === 0) return false;
    return this.familyMembers.some(index => {
      const familyFields = [
        `familyFirstName_${index}`, `familyMiddleName_${index}`, `familyLastName_${index}`,
        `familyGender_${index}`, `familyDateOfBirth_${index}`, `familyIdProofType_${index}`,
        `familyIdProofNumber_${index}`, `familyIdProofPath_${index}`, `familyMemberRelation_${index}`
      ];
      return familyFields.some(field => this.frmValidate.get(field)?.invalid) ||
             !this.selectedFiles[`familyIdProofPath_${index}`] ||
             !(this.selectedFiles[`familyIdProofPath_${index}`] instanceof File);
    });
  }

  // New method to check if form is invalid for submission
  isFormInvalidForSubmit(): boolean {
    const controls = this.frmValidate.controls;
    const additionalFields = [
      'daysAttending', 'accommodationRequired', 'mealsRequired', 'noOfMembers',
      'healthProblem', 'remarks', 'isTermsAndCondtionAccepted'
    ];
    return this.frmValidate.invalid ||
           !this.selectedFiles['idProofPath'] ||
           !(this.selectedFiles['idProofPath'] instanceof File) ||
           this.familyMembers.some(index => 
             this.frmValidate.get(`familyIdProofPath_${index}`)?.invalid ||
             !this.selectedFiles[`familyIdProofPath_${index}`] ||
             !(this.selectedFiles[`familyIdProofPath_${index}`] instanceof File)
           ) ||
           additionalFields.some(field => controls[field]?.invalid) ||
           controls['noOfMembers']?.value !== this.familyMembers.length + 1;
  }

  dateNotInFutureValidator() {
    return (control: AbstractControl) => {
      if (!control.value) return null;
      const dob = new Date(control.value);
      const today = new Date();
      if (dob > today) {
        return { futureDate: true };
      }
      return null;
    };
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPwd = form.get('confirmPwd')?.value;
    return password === confirmPwd ? null : { mismatch: true };
  }

  noOfMembersValidator(form: FormGroup) {
    const noOfMembers = form.get('noOfMembers')?.value;
    const familyMembersCount = Object.keys(form.controls).filter(key => key.startsWith('familyFirstName_')).length;
    return noOfMembers === familyMembersCount + 1 ? null : { noOfMembersMismatch: true };
  }

  ngOnInit(): void {
    App.addListener('appStateChange', ({ isActive }) => {
      this.ngZone.run(() => {
        console.log(`App state changed, isActive: ${isActive}`);
        if (!isActive && this.isListening) {
          console.log('App paused, stopping voice input');
          this.stopVoiceInput();
        }
      });
    });
    this.frmValidate.valueChanges.subscribe(() => {
      if (this.submitted) {
        setTimeout(() => {
          this.submitted = false;
          this.cdr.detectChanges();
        }, 5000);
      }
    });
    this.initializeSpeechRecognition();
    this.cdr.detectChanges();
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.registerUserSubscription) {
      this.registerUserSubscription.unsubscribe();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.stopVoiceInput();
    if (this.modalInstance) {
      this.modalInstance.dispose();
    }
  }

  get f(): { [key: string]: AbstractControl } {
    return this.frmValidate.controls;
  }

  getSelectedFileName(controlName: string): string {
    const file = this.selectedFiles[controlName];
    return file ? file.name : '';
  }

  onFileChange(event: Event, controlName: string) {
    const input = event.target as HTMLInputElement;
    try {
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          this.frmValidate.get(controlName)?.setErrors({ invalidFileType: true });
          this.userMessage = 'Only PDF, JPG, or PNG files are allowed.';
          this.openModel();
          return;
        }
        this.selectedFiles[controlName] = file;
        this.frmValidate.get(controlName)?.setValue(file.name);
      } else {
        this.clearFile(controlName);
      }
    } catch (error) {
      console.error(`Error in onFileChange for ${controlName}:`, error);
      this.userMessage = 'Error processing file. Please try again.';
      this.openModel();
    }
    this.cdr.detectChanges();
  }

  clearFile(controlName: string) {
    delete this.selectedFiles[controlName];
    const inputElement = document.getElementById(controlName) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
    this.frmValidate.get(controlName)?.setValue('');
    this.cdr.detectChanges();
  }

  async initializeSpeechRecognition(): Promise<void> {
    try {
      const { available } = await SpeechRecognition.available();
      if (!available) {
        console.error('Speech recognition not available on this device');
        this.userMessage = 'Speech recognition is not supported on this device. Please use manual input.';
        this.isSpeechAvailable = false;
        this.openModel();
        return;
      }
      this.isSpeechAvailable = true;
      console.log('Speech recognition initialized successfully');
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      this.userMessage = 'Failed to initialize speech recognition. Please check device settings and try again.';
      this.isSpeechAvailable = false;
      this.openModel();
    }
  }

  async checkSpeechPermission(): Promise<boolean> {
    try {
      const { speechRecognition } = await SpeechRecognition.checkPermissions();
      if (speechRecognition !== 'granted') {
        const { speechRecognition: perm } = await SpeechRecognition.requestPermissions();
        if (perm !== 'granted') {
          this.userMessage = 'Microphone permission is required for voice input. Please enable it in your device settings.';
          this.openModel();
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking speech permissions:', error);
      this.userMessage = 'Error accessing microphone. Please check permissions in device settings.';
      this.openModel();
      return false;
    }
  }

  setCurrentField(fieldName: string): void {
    if (!this.frmValidate.get(fieldName)) {
      console.warn(`Invalid field name: ${fieldName}`);
      this.userMessage = `Cannot use voice input for ${fieldName}. Please select a valid field.`;
      this.openModel();
      return;
    }
    console.log(`setCurrentField: fieldName=${fieldName}, isListening=${this.isListening}, isPaused=${this.isPaused}`);
    if (this.currentField !== fieldName && this.isListening && !this.isPaused) {
      this.pauseVoiceInput().then(() => {
        this.currentField = fieldName;
        if (this.isListening) {
          this.resumeVoiceInput(fieldName);
        }
        this.cdr.detectChanges();
      });
    } else {
      this.currentField = fieldName;
      this.cdr.detectChanges();
    }
  }

  async toggleVoiceInput(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    const currentTime = Date.now();
    if (currentTime - this.lastTapTime < this.tapDebounceTime) {
      console.log('Tap debounced, ignoring');
      return;
    }
    this.lastTapTime = currentTime;

    if (!this.isSpeechAvailable) {
      this.userMessage = 'Speech recognition is not available on this device.';
      this.openModel();
      return;
    }

    if (!this.currentField || !this.frmValidate.get(this.currentField)) {
      this.userMessage = 'Please select an input field before using voice input.';
      this.openModel();
      return;
    }

    this.ngZone.run(async () => {
      console.log(`toggleVoiceInput: isListening=${this.isListening}, isPaused=${this.isPaused}, currentField=${this.currentField}`);
      if (this.isListening && !this.isPaused) {
        await this.stopVoiceInput();
      } else if (this.isListening && this.isPaused) {
        await this.resumeVoiceInput(this.currentField);
      } else {
        await this.startVoiceInput(this.currentField);
      }
      this.cdr.detectChanges();
    });
  }

  async startVoiceInput(fieldName: string): Promise<void> {
    if (!this.isSpeechAvailable) {
      this.userMessage = 'Speech recognition is not available. Please use manual input.';
      this.openModel();
      return;
    }

    if (!fieldName || !this.frmValidate.get(fieldName)) {
      this.userMessage = 'Selected field is invalid. Please select a valid input field.';
      this.openModel();
      return;
    }

    if (!(await this.checkSpeechPermission())) {
      this.isListening = false;
      this.isPaused = false;
      this.currentField = '';
      this.cdr.detectChanges();
      return;
    }

    try {
      console.log(`startVoiceInput: fieldName=${fieldName}`);
      await this.resetSpeechRecognition();
      this.isListening = true;
      this.isPaused = false;
      this.currentField = fieldName;
      this.cdr.detectChanges();

      await SpeechRecognition.start({
        language: 'hi-IN',
        maxResults: 1,
        prompt: `Speak your ${fieldName.replace(/([A-Z])/g, ' $1').replace(/^family/, 'family ').toLowerCase()}`,
        partialResults: true,
        popup: false
      });

      SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
        const currentTime = Date.now();
        if (currentTime - this.lastResultTime < this.resultDebounceTime) {
          return;
        }
        this.lastResultTime = currentTime;
        if (data.matches && data.matches.length > 0 && this.currentField === fieldName && !this.isPaused) {
          this.ngZone.run(() => {
            console.log(`partialResults: fieldName=${fieldName}, text=${data.matches[0]}`);
            this.updateField(fieldName, data.matches[0]);
            this.cdr.detectChanges();
          });
        }
      });

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          console.log('Voice input timeout, stopping');
          this.stopVoiceInput();
        });
      }, 10000);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.userMessage = `Failed to start microphone: ${error instanceof Error ? error.message : 'Unknown error'}.`;
      this.openModel();
      this.isListening = false;
      this.isPaused = false;
      this.currentField = '';
      this.cdr.detectChanges();
    }
  }

  async pauseVoiceInput(): Promise<void> {
    if (!this.isListening || this.isPaused) {
      console.log(`pauseVoiceInput: Skipping, isListening=${this.isListening}, isPaused=${this.isPaused}`);
      return;
    }
    try {
      console.log('Pausing voice input');
      await SpeechRecognition.stop();
      this.isPaused = true;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error pausing speech recognition:', error);
      this.userMessage = `Failed to pause microphone: ${error instanceof Error ? error.message : 'Unknown error'}.`;
      this.openModel();
      this.isListening = false;
      this.isPaused = false;
      this.cdr.detectChanges();
    }
  }

  async resumeVoiceInput(fieldName: string): Promise<void> {
    if (!this.isListening || !this.isPaused || !this.isSpeechAvailable) {
      console.log(`resumeVoiceInput: Skipping, isListening=${this.isListening}, isPaused=${this.isPaused}, isSpeechAvailable=${this.isSpeechAvailable}`);
      return;
    }
    try {
      console.log(`resumeVoiceInput: fieldName=${fieldName}`);
      this.isPaused = false;
      this.currentField = fieldName;
      await this.resetSpeechRecognition();
      await SpeechRecognition.start({
        language: 'hi-IN',
        maxResults: 1,
        prompt: `Speak your ${fieldName.replace(/([A-Z])/g, ' $1').replace(/^family/, 'family ').toLowerCase()}`,
        partialResults: true,
        popup: false
      });

      SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
        const currentTime = Date.now();
        if (currentTime - this.lastResultTime < this.resultDebounceTime) {
          return;
        }
        this.lastResultTime = currentTime;
        if (data.matches && data.matches.length > 0 && this.currentField === fieldName && !this.isPaused) {
          this.ngZone.run(() => {
            console.log(`partialResults: fieldName=${fieldName}, text=${data.matches[0]}`);
            this.updateField(fieldName, data.matches[0]);
            this.cdr.detectChanges();
          });
        }
      });

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          console.log('Voice input timeout, stopping');
          this.stopVoiceInput();
        });
      }, 10000);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error resuming speech recognition:', error);
      this.userMessage = `Failed to resume microphone: ${error instanceof Error ? error.message : 'Unknown error'}.`;
      this.openModel();
      this.isListening = false;
      this.isPaused = false;
      this.currentField = '';
      this.cdr.detectChanges();
    }
  }

  async stopVoiceInput(): Promise<void> {
    try {
      console.log('Stopping voice input');
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      await this.resetSpeechRecognition();
      this.isListening = false;
      this.isPaused = false;
      this.currentField = '';
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      this.userMessage = `Failed to stop microphone: ${error instanceof Error ? error.message : 'Unknown error'}.`;
      this.openModel();
      this.cdr.detectChanges();
    }
  }

  async resetSpeechRecognition(): Promise<void> {
    try {
      await SpeechRecognition.stop();
      SpeechRecognition.removeAllListeners();
      console.log('Speech recognition reset successfully');
    } catch (error) {
      console.error('Error resetting speech recognition:', error);
    }
  }

  private updateField(fieldName: string, text: string): void {
    if (fieldName !== this.currentField || this.isPaused) {
      console.warn(`Ignoring update for ${fieldName}, currentField=${this.currentField}, isPaused=${this.isPaused}`);
      return;
    }

    const control = this.frmValidate.get(fieldName);
    if (!control) {
      this.userMessage = `Error: Field ${fieldName} not found.`;
      this.openModel();
      return;
    }

    if (['pinCode', 'mobileNumber', 'whatsappNumber', 'emergencyNumber', 'noOfMembers'].includes(fieldName)) {
      const num = text.replace(/\D/g, '');
      control.setValue(num);
      this.cdr.detectChanges();
      return;
    }

    const selectFieldMap: { [key: string]: { [key: string]: string } } = {
      gender: {
        'male': 'Male', 'पुरुष': 'Male', 'man': 'Male',
        'female': 'Female', 'महिला': 'Female', 'woman': 'Female',
        'other': 'Other', 'अन्य': 'Other'
      },
      idProofType: {
        'aadhaar': 'Aadhaar', 'आधार': 'Aadhaar',
        'passport': 'Passport', 'पासपोर्ट': 'Passport',
        'voter id': 'Voter ID', 'वोटर': 'Voter ID',
        'driving license': 'Driving License', 'ड्राइविंग': 'Driving License'
      },
      familyGender: {
        'male': 'Male', 'पुरुष': 'Male', 'man': 'Male',
        'female': 'Female', 'महिला': 'Female', 'woman': 'Female',
        'other': 'Other', 'अन्य': 'Other'
      },
      familyIdProofType: {
        'aadhaar': 'Aadhaar', 'आधार': 'Aadhaar',
        'passport': 'Passport', 'पासपोर्ट': 'Passport',
        'voter id': 'Voter ID', 'वोटर': 'Voter ID',
        'driving license': 'Driving License', 'ड्राइविंग': 'Driving License'
      },
      familyMemberRelation: {
        'spouse': 'Spouse', 'पति': 'Spouse', 'पत्नी': 'Spouse',
        'child': 'Child', 'बच्चा': 'Child',
        'parent': 'Parent', 'माता': 'Parent', 'पिता': 'Parent',
        'sibling': 'Sibling', 'भाई': 'Sibling', 'बहन': 'Sibling',
        'other': 'Other', 'अन्य': 'Other'
      },
      daysAttending: {
        'friday': 'Fri', 'शुक्रवार': 'Fri',
        'saturday': 'Sat', 'शनिवार': 'Sat',
        'sunday': 'Sun', 'रविवार': 'Sun',
        'all': 'All', 'सभी': 'All'
      },
      accommodationRequired: {
        'yes': 'Yes', 'हाँ': 'Yes',
        'no': 'No', 'नहीं': 'No'
      },
      mealsRequired: {
        'yes': 'Yes', 'हाँ': 'Yes',
        'no': 'No', 'नहीं': 'No'
      }
    };

    const fieldKey = fieldName.startsWith('familyGender') ? 'familyGender' :
                     fieldName.startsWith('familyIdProofType') ? 'familyIdProofType' :
                     fieldName.startsWith('familyMemberRelation') ? 'familyMemberRelation' : fieldName;

    if (selectFieldMap[fieldKey]) {
      const normalizedText = text.toLowerCase().trim();
      const value = selectFieldMap[fieldKey][normalizedText] || '';
      if (value) {
        control.setValue(value);
      } else {
        this.userMessage = `Could not recognize "${text}" for ${fieldKey.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
        this.openModel();
      }
      this.cdr.detectChanges();
      return;
    }

    if (fieldName === 'email') {
      let emailText = text.toLowerCase()
        .replace(/\s+at\s+/g, '@')
        .replace(/\s+dot\s+/g, '.')
        .replace(/\s+/g, '');
      control.setValue(emailText);
      this.cdr.detectChanges();
      return;
    }

    control.setValue(text);
    this.cdr.detectChanges();
  }

  addFamilyMember() {
    const index = this.familyMembers.length;
    this.familyMembers.push(index);
    this.frmValidate.addControl(`familyFirstName_${index}`, this.fv.control('', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]));
    this.frmValidate.addControl(`familyMiddleName_${index}`, this.fv.control('', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]));
    this.frmValidate.addControl(`familyLastName_${index}`, this.fv.control('', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z]+$')]));
    this.frmValidate.addControl(`familyGender_${index}`, this.fv.control('', [Validators.required]));
    this.frmValidate.addControl(`familyDateOfBirth_${index}`, this.fv.control('', [Validators.required, this.dateNotInFutureValidator()]));
    this.frmValidate.addControl(`familyIdProofType_${index}`, this.fv.control('', [Validators.required]));
    this.frmValidate.addControl(`familyIdProofNumber_${index}`, this.fv.control('', [Validators.required]));
    this.frmValidate.addControl(`familyIdProofPath_${index}`, this.fv.control('', [Validators.required]));
    this.frmValidate.addControl(`familyMemberRelation_${index}`, this.fv.control('', [Validators.required]));
    this.fFamily[index] = {
      firstName: this.frmValidate.get(`familyFirstName_${index}`),
      middleName: this.frmValidate.get(`familyMiddleName_${index}`),
      lastName: this.frmValidate.get(`familyLastName_${index}`),
      gender: this.frmValidate.get(`familyGender_${index}`),
      dateOfBirth: this.frmValidate.get(`familyDateOfBirth_${index}`),
      idProofType: this.frmValidate.get(`familyIdProofType_${index}`),
      idProofNumber: this.frmValidate.get(`familyIdProofNumber_${index}`),
      idProofPath: this.frmValidate.get(`familyIdProofPath_${index}`),
      memberRelation: this.frmValidate.get(`familyMemberRelation_${index}`)
    };
    this.frmValidate.get('noOfMembers')?.setValue(this.familyMembers.length + 1);
    this.cdr.detectChanges();
  }

  removeFamilyMember(index: number) {
    this.familyMembers = this.familyMembers.filter(i => i !== index);
    this.frmValidate.removeControl(`familyFirstName_${index}`);
    this.frmValidate.removeControl(`familyMiddleName_${index}`);
    this.frmValidate.removeControl(`familyLastName_${index}`);
    this.frmValidate.removeControl(`familyGender_${index}`);
    this.frmValidate.removeControl(`familyDateOfBirth_${index}`);
    this.frmValidate.removeControl(`familyIdProofType_${index}`);
    this.frmValidate.removeControl(`familyIdProofNumber_${index}`);
    this.frmValidate.removeControl(`familyIdProofPath_${index}`);
    this.frmValidate.removeControl(`familyMemberRelation_${index}`);
    delete this.selectedFiles[`familyIdProofPath_${index}`];
    this.fFamily[index] = undefined as any;
    this.fFamily = this.fFamily.filter((_, i) => i in this.familyMembers);
    this.frmValidate.get('noOfMembers')?.setValue(this.familyMembers.length + 1);
    this.cdr.detectChanges();
  }

  validateSection(section: number): boolean {
    const controls = this.frmValidate.controls;
    let isValid = true;
    if (section === 1) {
      const primaryFields = [
        'firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'address', 'city',
        'pinCode', 'mobileNumber', 'whatsappNumber', 'emergencyNumber', 'email',
        'password', 'confirmPwd', 'idProofType', 'idProofNumber', 'idProofPath'
      ];
      primaryFields.forEach(field => {
        controls[field]?.markAsTouched();
        if (controls[field]?.invalid) {
          isValid = false;
        }
      });
      if (!this.selectedFiles['idProofPath'] || !(this.selectedFiles['idProofPath'] instanceof File)) {
        controls['idProofPath']?.setErrors({ required: true });
        isValid = false;
      } else {
        controls['idProofPath']?.setErrors(null);
      }
    } else if (section === 2) {
      this.familyMembers.forEach(index => {
        const familyFields = [
          `familyFirstName_${index}`, `familyMiddleName_${index}`, `familyLastName_${index}`,
          `familyGender_${index}`, `familyDateOfBirth_${index}`, `familyIdProofType_${index}`,
          `familyIdProofNumber_${index}`, `familyMemberRelation_${index}`, `familyIdProofPath_${index}`
        ];
        familyFields.forEach(field => {
          controls[field]?.markAsTouched();
          if (controls[field]?.invalid) {
            isValid = false;
          }
        });
        const familyFileControl = `familyIdProofPath_${index}`;
        if (!this.selectedFiles[familyFileControl] || !(this.selectedFiles[familyFileControl] instanceof File)) {
          controls[familyFileControl]?.setErrors({ required: true });
          isValid = false;
        } else {
          controls[familyFileControl]?.setErrors(null);
        }
      });
    } else if (section === 3) {
      const additionalFields = [
        'daysAttending', 'accommodationRequired', 'mealsRequired', 'noOfMembers',
        'healthProblem', 'remarks', 'isTermsAndCondtionAccepted'
      ];
      additionalFields.forEach(field => {
        controls[field]?.markAsTouched();
        if (controls[field]?.invalid) {
          isValid = false;
        }
      });
      const noOfMembers = controls['noOfMembers']?.value;
      if (noOfMembers !== this.familyMembers.length + 1) {
        controls['noOfMembers']?.setErrors({ noOfMembersMismatch: true });
        isValid = false;
      }
    }
    this.cdr.detectChanges();
    return isValid;
  }

  nextSection() {
    this.submitted = true;
    if (this.validateSection(this.currentSection)) {
      this.currentSection = Math.min(this.currentSection + 1, 3);
      this.submitted = false;
    } else {
      this.userMessage = `Please complete all required fields in section ${this.currentSection}.`;
      this.openModel();
      setTimeout(() => {
        this.submitted = false;
        this.cdr.detectChanges();
      }, 5000);
    }
    this.cdr.detectChanges();
  }

  previousSection() {
    this.currentSection = Math.max(this.currentSection - 1, 1);
    this.submitted = false;
    this.cdr.detectChanges();
  }

  private calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    if (dob > today) {
      return 0;
    }
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  openModel() {
    const modalElement = document.getElementById('responseModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement, { keyboard: false });
      this.modalInstance.show();
      if (!this.userMessage) {
        setTimeout(() => {
          this.redirectToLogin();
        }, 5000);
      }
    }
    this.cdr.detectChanges();
  }

  closeModel() {
    if (this.modalInstance) {
      this.modalInstance.hide();
      this.modalInstance = null;
      if (!this.userMessage) {
        this.redirectToLogin();
      }
    }
    this.cdr.detectChanges();
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }

  onReset() {
    this.frmValidate.reset({
      noOfMembers: 1,
      isTermsAndCondtionAccepted: false
    });
    this.familyMembers = [];
    this.fFamily = [];
    this.selectedFiles = {};
    this.currentSection = 1;
    this.submitted = false;
    this.userMessage = '';
    this.isListening = false;
    this.isPaused = false;
    this.currentField = '';
    this.stopVoiceInput();
    this.cdr.detectChanges();
  }

  onRegisterUser() {
    this.submitted = true;
    if (this.currentSection !== 3) {
      this.userMessage = 'Please complete all sections before submitting.';
      this.openModel();
      return;
    }

    if (this.frmValidate.valid && !this.isFormInvalidForSubmit()) {
      const formData = new FormData();
      const allUsers: RegisterUserRequest[] = [];
      const idProofFiles: File[] = [];

      // Validate primary user's file
      if (!this.selectedFiles['idProofPath'] || !(this.selectedFiles['idProofPath'] instanceof File)) {
        this.userMessage = 'Please upload a valid ID proof for the primary user.';
        this.openModel();
        return;
      }
      idProofFiles.push(this.selectedFiles['idProofPath']);

      // Build primary user
      const now = new Date();
      const primaryUser: RegisterUserRequest = {
        firstName: this.frmValidate.value.firstName,
        middleName: this.frmValidate.value.middleName,
        lastName: this.frmValidate.value.lastName,
        gender: this.frmValidate.value.gender,
        dateOfBirth: this.frmValidate.value.dateOfBirth,
        age: this.calculateAge(this.frmValidate.value.dateOfBirth),
        address: this.frmValidate.value.address,
        city: this.frmValidate.value.city,
        pinCode: this.frmValidate.value.pinCode,
        mobileNumber: this.frmValidate.value.mobileNumber,
        email: this.frmValidate.value.email,
        password: this.frmValidate.value.password,
        whatsappNumber: this.frmValidate.value.whatsappNumber || '',
        emergencyNumber: this.frmValidate.value.emergencyNumber || '',
        idProofType: this.frmValidate.value.idProofType,
        idProofNumber: this.frmValidate.value.idProofNumber,
        idProofPath: this.selectedFiles['idProofPath'].name,
        memberRelation: '',
        daysAttending: this.frmValidate.value.daysAttending,
        accommodationRequired: this.frmValidate.value.accommodationRequired,
        mealsRequired: this.frmValidate.value.mealsRequired,
        healthProblem: this.frmValidate.value.healthProblem || '',
        remarks: this.frmValidate.value.remarks || '',
        noOfMembers: this.frmValidate.value.noOfMembers,
        active: true,
        locked: false,
        createdBy: this.frmValidate.value.email,
        createdDateTime: this.formatDate(now),
        updatedBy: this.frmValidate.value.email,
        updatedDatetime: this.formatDate(now),
        corpoName: 'none',
        branch: 'none',
        landlineNumber: 'none',
        userType: 1,
        eventId: 0,
        isSelected: false
      };
      allUsers.push(primaryUser);

      // Validate and build family members
      for (const index of this.familyMembers) {
        const familyFile = this.selectedFiles[`familyIdProofPath_${index}`];
        if (!familyFile || !(familyFile instanceof File)) {
          this.userMessage = `Please upload a valid ID proof for family member ${index + 1}.`;
          this.openModel();
          return;
        }
        idProofFiles.push(familyFile);

        const familyUser: RegisterUserRequest = {
          ...primaryUser,
          firstName: this.frmValidate.value[`familyFirstName_${index}`],
          middleName: this.frmValidate.value[`familyMiddleName_${index}`],
          lastName: this.frmValidate.value[`familyLastName_${index}`],
          gender: this.frmValidate.value[`familyGender_${index}`],
          dateOfBirth: this.frmValidate.value[`familyDateOfBirth_${index}`],
          age: this.calculateAge(this.frmValidate.value[`familyDateOfBirth_${index}`]),
          idProofType: this.frmValidate.value[`familyIdProofType_${index}`],
          idProofNumber: this.frmValidate.value[`familyIdProofNumber_${index}`],
          idProofPath: this.selectedFiles[`familyIdProofPath_${index}`].name,
          memberRelation: this.frmValidate.value[`familyMemberRelation_${index}`],
          email: '',
          password: '',
          userType: 2
        };
        allUsers.push(familyUser);
      }

      // Debug logs
      console.log('Number of users:', allUsers.length);
      console.log('Number of files:', idProofFiles.length);
      console.log('Users:', allUsers);
      console.log('Files:', idProofFiles.map(file => file.name));

      // Validate counts match
      if (allUsers.length !== idProofFiles.length) {
        this.userMessage = `Error: Number of users (${allUsers.length}) does not match number of files (${idProofFiles.length}).`;
        console.error('Mismatch detected:', {
          users: allUsers.map(u => ({ firstName: u.firstName, idProofPath: u.idProofPath })),
          files: idProofFiles.map(f => f.name)
        });
        this.openModel();
        return;
      }

      // Append to FormData
      formData.append('users', JSON.stringify(allUsers));
      idProofFiles.forEach((file, index) => {
        formData.append(`idProofFiles[${index}]`, file, file.name);
      });

      this.registerUserSubscription = this.authService.registerUser(formData).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.userMessage = '';
          this.openModel();
        },
        error: (error) => {
          console.error('Registration error:', error);
          this.userMessage = error.error?.message || 'Registration failed. Please try again.';
          this.openModel();
        }
      });
    } else {
      this.userMessage = 'Please correct the errors in the form before submitting.';
      this.openModel();
      setTimeout(() => {
        this.submitted = false;
        this.cdr.detectChanges();
      }, 5000);
    }
  }
}