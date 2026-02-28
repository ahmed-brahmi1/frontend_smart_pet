import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Layout } from './layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Feeding } from './pages/feeding/feeding';
import { About } from './pages/about/about';
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
      { path: 'feeding', component: Feeding },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
