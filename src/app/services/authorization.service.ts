import { Injectable, inject } from '@angular/core';
import { AccessMenu, AccessSubmenu } from '../models/auth/authentication/AccessProfile';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private readonly authService = inject(AuthService);

  hasPermission(permission: string): boolean {
    if (!permission) {
      return true;
    }

    const normalized = permission.trim().toUpperCase();
    return (this.authService.accessProfile()?.permissions || []).some((p) => p.trim().toUpperCase() === normalized);
  }

  canAccessMenu(menuKey: string): boolean {
    if (!menuKey) {
      return true;
    }

    return !!this.findMenu(menuKey);
  }

  canAccessSubmenu(menuKey: string, submenuKey: string): boolean {
    if (!menuKey || !submenuKey) {
      return true;
    }

    const menu = this.findMenu(menuKey);
    if (!menu) {
      return false;
    }

    return !!this.findSubmenu(menu, submenuKey);
  }

  canDo(menuKey: string, submenuKey: string, actionKey: string): boolean {
    if (!menuKey || !submenuKey || !actionKey) {
      return true;
    }

    const menu = this.findMenu(menuKey);
    if (!menu) {
      return false;
    }

    const submenu = this.findSubmenu(menu, submenuKey);
    if (!submenu) {
      return false;
    }

    const normalizedAction = actionKey.trim().toUpperCase();
    return submenu.actions.some((action) => action.trim().toUpperCase() === normalizedAction);
  }

  private findMenu(menuKey: string): AccessMenu | undefined {
    const normalizedMenu = menuKey.trim().toUpperCase();
    return (this.authService.accessProfile()?.menus || []).find((menu) => menu.key.trim().toUpperCase() === normalizedMenu);
  }

  private findSubmenu(menu: AccessMenu, submenuKey: string): AccessSubmenu | undefined {
    const normalizedSubmenu = submenuKey.trim().toUpperCase();
    return menu.submenus.find((submenu) => submenu.key.trim().toUpperCase() === normalizedSubmenu);
  }
}
