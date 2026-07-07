export interface UpdateUserRequest {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  roleIds: number[];
}