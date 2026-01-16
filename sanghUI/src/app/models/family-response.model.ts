export interface FamilyResponseDTO {
  head: UserRegistration;
  members: UserRegistration[];
}

export interface FamilyListResponse {
  status: string;
  data: FamilyResponseDTO[];
  message: string;
}

export interface UserRegistration {
  userid: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string;
  city: string;
  mobileNumber: string;
  email: string;
  // Add other fields as per your UserRegistration model (e.g., eventId, userType)
}