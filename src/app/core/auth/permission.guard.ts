import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthorizationService } from '../../services/authorization.service';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const authorizationService = inject(AuthorizationService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const requiredPermission = route.data?.['requiredPermission'] as string | undefined;
  const menuKey = route.data?.['menuKey'] as string | undefined;
  const submenuKey = route.data?.['submenuKey'] as string | undefined;

  if (requiredPermission && !authorizationService.hasPermission(requiredPermission)) {
    return router.createUrlTree(['/auth/access']);
  }

  if (menuKey && submenuKey && !authorizationService.canAccessSubmenu(menuKey, submenuKey)) {
    return router.createUrlTree(['/auth/access']);
  }

  if (menuKey && !submenuKey && !authorizationService.canAccessMenu(menuKey)) {
    return router.createUrlTree(['/auth/access']);
  }

  return true;
};
