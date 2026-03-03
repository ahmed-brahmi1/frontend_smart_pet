import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Users } from './users/users';
import { Devices } from './devices/devices';
import { SystemHealth } from './system-health/system-health';
import { Pets } from './pets/pets';

const routes: Routes = [
  { path: 'user-management', component: Users },
  { path: 'device-management', component: Devices },
  { path: 'system-health', component: SystemHealth },
  { path: 'pets', component: Pets },
  { path: '', redirectTo: 'system-health', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
