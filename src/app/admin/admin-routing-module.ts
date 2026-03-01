import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Users } from './users/users';
import { Devices } from './devices/devices';

const routes: Routes = [
  { path: 'user-management', component: Users },
  { path: 'device-management', component: Devices },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
