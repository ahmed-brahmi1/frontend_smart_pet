import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { UserLayout } from './layouts/user-layout/user-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { DeviceDetail } from './pages/devices/device-detail/device-detail';
import { About } from './pages/about/about';
import { Pets } from './admin/pets/pets';
import { PetMonitor } from './pages/pet-monitor/pet-monitor';
import { HealthMonitoring } from './pages/health-monitoring/health-monitoring';
import { FoodMonitoring } from './pages/food-monitoring/food-monitoring';
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
          { path: 'health', component: HealthMonitoring },
          { path: 'food', component: FoodMonitoring },
          { path: 'pets', component: Pets },
          { path: 'pet/:id', component: PetMonitor },
          { path: 'devices', component: Devices },
          { path: 'device/:id', component: DeviceDetail },
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
