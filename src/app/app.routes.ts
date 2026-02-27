import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Layout } from './layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Feeding } from './pages/feeding/feeding';
import { About } from './pages/about/about'

export const routes: Routes = [

  // Pages indépendantes (sans sidebar)
  { path: '', component: Login },
  { path: 'register', component: Register },
   { path: 'about', component: About },

  // Pages avec sidebar
  {
    path: '',
    component: Layout,
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'feeding', component: Feeding },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
     
    ]
  }
];
