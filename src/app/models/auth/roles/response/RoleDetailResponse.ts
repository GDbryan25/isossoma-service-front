import { PermissionResponse } from "../../permissions/PermissionResponse";

export interface RoleDetailResponse {
  id: number;
  name: string;
  description: string;
  status: string;
  permissions: PermissionResponse[];
}