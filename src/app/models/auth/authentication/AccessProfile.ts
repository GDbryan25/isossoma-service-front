export interface AccessSubmenu {
  key: string;
  route: string | null;
  actions: string[];
}

export interface AccessMenu {
  key: string;
  route: string | null;
  submenus: AccessSubmenu[];
}

export interface PermissionDetail {
  id: number;
  authority: string;
  description: string;
  menuKey: string | null;
  submenuKey: string | null;
  actionKey: string | null;
  route: string | null;
}

export interface AccessProfile {
  userId: number;
  username: string;
  roles: string[];
  permissions: string[];
  menus: AccessMenu[];
  permissionDetails: PermissionDetail[];
}
