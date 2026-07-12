import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../services/auth.service';
import { AccessMenu, AccessSubmenu } from '../../models/auth/authentication/AccessProfile';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    constructor(private authService: AuthService) {}

    ngOnInit() {
        const profileMenus = this.authService.accessProfile()?.menus || [];

        this.model = profileMenus.length
            ? this.buildFromAccessProfile(profileMenus)
            : this.buildFallbackMenu();
    }

    private buildFromAccessProfile(menus: AccessMenu[]): MenuItem[] {
        const mappedMenus = menus
            .map((menu) => ({
                key: this.normalizeKey(menu.key),
                label: this.resolveMenuLabel(menu.key),
                items: (menu.submenus || [])
                    .map((submenu) => this.mapSubmenu(menu, submenu))
                    .filter((item): item is MenuItem => !!item)
            }))
            .filter((menu) => menu.items.length > 0);

        // INICIO should always be shown first when present.
        mappedMenus.sort((a, b) => {
            if (a.key === 'INICIO') {
                return -1;
            }
            if (b.key === 'INICIO') {
                return 1;
            }
            return 0;
        });

        return mappedMenus.map(({ label, items }) => ({ label, items }));
    }

    private mapSubmenu(menu: AccessMenu, submenu: AccessSubmenu): MenuItem | null {
        const submenuKey = this.normalizeKey(submenu.key);
        if (submenuKey === 'ITEM_SUPPLIER' || submenuKey === 'ITEM-SUPPLIER' || submenuKey === 'ITEMSUPPLIER') {
            return null;
        }

        const normalizedRoute = this.normalizeRoute(submenu.route || menu.route || '/');

        // item-supplier is an internal screen from Tarifarios, not a sidebar submenu.
        if (
            normalizedRoute === '/gestion/tarifarios/item-supplier' ||
            normalizedRoute.startsWith('/gestion/tarifarios/item-supplier/') ||
            normalizedRoute.includes('item-supplier')
        ) {
            return null;
        }

        return {
            label: this.resolveSubmenuLabel(submenu.key),
            icon: this.resolveSubmenuIcon(submenu.key, normalizedRoute),
            routerLink: [normalizedRoute]
        };
    }

    private buildFallbackMenu(): MenuItem[] {
        return [
            {
                label: 'Inicio',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/inicio/dashboard'] }]
            },
            {
                label: 'Gestión',
                items: [
                    { label: 'Clientes', icon: 'pi pi-fw pi-building', routerLink: ['/gestion/clientes'] },
                    { label: 'Tarifarios', icon: 'pi pi-fw pi-money-bill', routerLink: ['/gestion/tarifarios'] },
                    { label: 'Proveedores', icon: 'pi pi-shopping-cart', routerLink: ['/gestion/proveedores'] }
                ]
            },
            {
                label: 'Seguridad',
                items: [
                    { label: 'Usuarios', icon: 'pi pi-fw pi-user', routerLink: ['/seguridad/usuarios'] },
                    { label: 'Roles', icon: 'pi pi-shield', routerLink: ['/seguridad/roles'] }
                ]
            },
            {
                label: 'Operaciones',
                items: [{ label: 'Cotizaciones', icon: 'pi pi-fw pi-file-edit', routerLink: ['/operaciones/cotizaciones'] }]
            }
        ];
    }

    private normalizeRoute(route: string): string {
        const raw = route.startsWith('/') ? route : `/${route}`;

        const aliases: Record<string, string> = {
            '/dashboard': '/inicio/dashboard',
            '/inicio': '/inicio/dashboard',
            '/clientes': '/gestion/clientes',
            '/tarifarios': '/gestion/tarifarios',
            '/proveedores': '/gestion/proveedores',
            '/usuarios': '/seguridad/usuarios',
            '/roles': '/seguridad/roles',
            '/cotizaciones': '/operaciones/cotizaciones'
        };

        return aliases[raw] || raw;
    }

    private resolveMenuLabel(menuKey: string): string {
        const key = this.normalizeKey(menuKey);
        const labels: Record<string, string> = {
            INICIO: 'Inicio',
            GESTION: 'Gestión',
            SEGURIDAD: 'Seguridad',
            OPERACIONES: 'Operaciones'
        };

        return labels[key] || menuKey;
    }

    private resolveSubmenuLabel(submenuKey: string): string {
        const key = this.normalizeKey(submenuKey);
        const labels: Record<string, string> = {
            DASHBOARD: 'Dashboard',
            CLIENTES: 'Clientes',
            TARIFARIOS: 'Tarifarios',
            PROVEEDORES: 'Proveedores',
            USUARIOS: 'Usuarios',
            ROLES: 'Roles',
            COTIZACIONES: 'Cotizaciones'
        };

        return labels[key] || submenuKey;
    }

    private resolveSubmenuIcon(submenuKey: string, route: string): string {
        const key = this.normalizeKey(submenuKey);
        const icons: Record<string, string> = {
            DASHBOARD: 'pi pi-fw pi-home',
            CLIENTES: 'pi pi-fw pi-building',
            TARIFARIOS: 'pi pi-fw pi-money-bill',
            PROVEEDORES: 'pi pi-fw pi-shopping-cart',
            USUARIOS: 'pi pi-fw pi-user',
            ROLES: 'pi pi-fw pi-shield',
            COTIZACIONES: 'pi pi-fw pi-file-edit'
        };

        if (icons[key]) {
            return icons[key];
        }

        const routeIcons: Record<string, string> = {
            '/inicio/dashboard': 'pi pi-fw pi-home',
            '/gestion/clientes': 'pi pi-fw pi-building',
            '/gestion/tarifarios': 'pi pi-fw pi-money-bill',
            '/gestion/proveedores': 'pi pi-fw pi-shopping-cart',
            '/seguridad/usuarios': 'pi pi-fw pi-user',
            '/seguridad/roles': 'pi pi-fw pi-shield',
            '/operaciones/cotizaciones': 'pi pi-fw pi-file-edit'
        };

        return routeIcons[route] || 'pi pi-fw pi-folder';
    }

    private normalizeKey(value: string): string {
        return (value || '').trim().toUpperCase();
    }
}
