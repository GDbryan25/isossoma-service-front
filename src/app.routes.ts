import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { CustomersComponent } from './app/pages/customers/customers.component';
import { RateSheetComponent } from './app/pages/rate-sheet/rate-sheet.component';
import { SuppliersComponent } from './app/pages/suppliers/suppliers.component';
import { UsersComponent } from './app/pages/users/users.component';
import { Login } from './app/pages/auth/login';

export const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        component: AppLayout,
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'gestion/clientes', component: CustomersComponent },
            { path: 'gestion/tarifarios', component: RateSheetComponent },
            { path: 'gestion/usuarios', component: UsersComponent },
            { path: 'gestion/proveedores', component: SuppliersComponent },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'operaciones/cotizaciones', component: Dashboard },
            { path: 'seguridad/usuarios', component: UsersComponent },
            { path: 'seguridad/roles', component: Dashboard }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
