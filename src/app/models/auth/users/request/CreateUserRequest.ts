export interface CreateUserRequest {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  roleIds: number[];
}