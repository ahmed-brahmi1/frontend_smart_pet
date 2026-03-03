import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing-module';
import { Users } from './users/users';
import { Devices } from './devices/devices';
import { SystemHealth } from './system-health/system-health';
import { Pets } from './pets/pets';

@NgModule({
  declarations: [],
  imports: [CommonModule, AdminRoutingModule, Users, Devices, SystemHealth, Pets],
})
export class AdminModule {}
