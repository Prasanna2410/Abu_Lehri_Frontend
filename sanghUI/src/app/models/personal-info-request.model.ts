export interface PersonalInfoRequest {
  userid: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date | null;
  address: string;
  city: string;
  pinCode: string;
  mobileNumber: string;
  email: string;
  corpoName: string;
  branch: string;
  landlineNumber: string;
  userType: number;
  name: string;
      mobile: string;
      tentNumber: string;
      state: string;


}

export interface GetPersonalInfoRequest {
  userid: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Date;
  strDateOfBirth: string;
  address: string;
  city: string;
  pinCode: string;
  mobileNumber: string;
  email: string;
  corpoName: string;
  branch: string;
  landlineNumber: string;
  userType: number;
    name: string;
        mobile: string;
              tentNumber: string;
      state: string;


  userInfo: PersonalInfoRequest[];
}
