import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing-module';
import { Users } from './users/users';
import { Devices } from './devices/devices';

@NgModule({
  declarations: [],
  imports: [CommonModule, AdminRoutingModule, Users, Devices],
})
export class AdminModule {}
