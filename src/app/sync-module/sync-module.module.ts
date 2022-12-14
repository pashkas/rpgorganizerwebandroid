import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SyncModuleRoutingModule } from './sync-module-routing.module';
import { SyncModuleComponent } from './sync-module.component';

@NgModule({
  declarations: [SyncModuleComponent],
  imports: [
    CommonModule,
    SyncModuleRoutingModule,
  ]
})
export class SyncModuleModule { }
