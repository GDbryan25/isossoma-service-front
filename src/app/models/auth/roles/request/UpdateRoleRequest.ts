export interface UpdateRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}