import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { UserLayout } from './layouts/user-layout/user-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { DeviceDetail } from './pages/devices/device-detail/device-detail';
import { Feeding } from './pages/feeding/feeding';
import { About } from './pages/about/about';
import { Pets } from './pages/pets/pets';
import { PetMonitor } from './pages/pet-monitor/pet-monitor';
import { Devices } from './pages/devices/index/devices';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import {
  dashboardRedirectGuard,
  defaultRedirectGuard,
} from './core/guards/dashboard-redirect.guard';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'register', component: Register },
  { path: 'about', component: About },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: UserLayout,
        children: [
          {
            path: 'dashboard',
            component: Dashboard,
            canActivate: [dashboardRedirectGuard],
          },
          { path: 'pets', component: Pets },
          { path: 'pet/:id', component: PetMonitor },
          { path: 'devices', component: Devices },
          { path: 'device/:id', component: DeviceDetail },
          { path: 'feeding', component: Feeding },
          { path: 'about', component: About },
          {
            path: 'admin',
            canActivate: [roleGuard(['ADMIN'])],
            loadChildren: () =>
              import('./admin/admin-module').then((m) => m.AdminModule),
          },
          {
            path: '',
            pathMatch: 'full',
            canActivate: [defaultRedirectGuard],
            children: [],
          },
        ],
      },
    ],
  },
];
