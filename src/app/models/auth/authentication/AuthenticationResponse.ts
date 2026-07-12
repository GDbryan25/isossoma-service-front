import { AccessProfile } from './AccessProfile';

export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer' | string;
  accessProfile: AccessProfile;
}
