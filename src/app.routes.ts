import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { CustomersComponent } from './app/pages/customers/customers.component';
import { RateSheetComponent } from './app/pages/rate-sheet/rate-sheet.component';
import { SuppliersComponent } from './app/pages/suppliers/suppliers.component';
import { UsersComponent } from './app/pages/security/users/users.component';
import { RolesComponent } from './app/pages/security/roles/roles.component';
import { ItemsComponent } from './app/pages/ratecatalog/items/items.component';
import { ItemSupplierComponent } from './app/pages/ratecatalog/item-supplier/item-supplier.component';
import { Login } from './app/pages/auth/login';
import { permissionGuard } from './app/core/auth/permission.guard';

export const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [permissionGuard],
        children: [
            { path: 'dashboard', redirectTo: 'inicio/dashboard', pathMatch: 'full' },
            { path: 'inicio/dashboard', component: Dashboard, data: { menuKey: 'INICIO', submenuKey: 'DASHBOARD' } },
            { path: 'gestion/clientes', component: CustomersComponent, data: { menuKey: 'GESTION', submenuKey: 'CLIENTES' } },
            { path: 'gestion/tarifarios', component: ItemsComponent, data: { menuKey: 'GESTION', submenuKey: 'TARIFARIOS' } },
            {
                path: 'gestion/tarifarios/item-supplier',
                component: ItemSupplierComponent,
                data: {
                    menuKey: 'GESTION',
                    submenuKey: 'TARIFARIOS',
                    requiredPermission: 'ITEM_SUPPLIER_WRITE'
                }
            },
            { path: 'gestion/usuarios', component: UsersComponent, data: { menuKey: 'SEGURIDAD', submenuKey: 'USUARIOS' } },
            { path: 'gestion/proveedores', component: SuppliersComponent, data: { menuKey: 'GESTION', submenuKey: 'PROVEEDORES' } },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'operaciones/cotizaciones', component: Dashboard, data: { menuKey: 'OPERACIONES', submenuKey: 'COTIZACIONES' } },
            { path: 'seguridad/usuarios', component: UsersComponent, data: { menuKey: 'SEGURIDAD', submenuKey: 'USUARIOS' } },
            { path: 'seguridad/roles', component: RolesComponent, data: { menuKey: 'SEGURIDAD', submenuKey: 'ROLES' } }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
