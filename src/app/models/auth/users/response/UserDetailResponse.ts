import { RoleDetailResponse } from "../../roles/response/RoleDetailResponse";

export interface UserDetailResponse {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  status: string;
  roles: RoleDetailResponse[];
}