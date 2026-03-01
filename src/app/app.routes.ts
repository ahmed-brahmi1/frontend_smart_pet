import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { Register } from './pages/auth/register/register';
import { Layout } from './layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { DeviceDetail } from './pages/devices/device-detail/device-detail';
import { Feeding } from './pages/feeding/feeding';
import { About } from './pages/about/about';
import { Pets } from './pages/pets/pets';
import { PetMonitor } from './pages/pet-monitor/pet-monitor';
import { Devices } from './pages/devices/index/devices';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'register', component: Register },
  { path: 'about', component: About },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'pets', component: Pets },
      { path: 'pet/:id', component: PetMonitor },
      { path: 'devices', component: Devices },
      { path: 'device/:id', component: DeviceDetail },
      { path: 'feeding', component: Feeding },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'admin',
        loadChildren: () =>
          import('./admin/admin-module').then((m) => m.AdminModule),
      },
    ],
  },
];
