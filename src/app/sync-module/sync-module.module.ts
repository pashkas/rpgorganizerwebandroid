import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SyncModuleRoutingModule } from './sync-module-routing.module';
import { SyncModuleComponent } from './sync-module.component';
import { NgxSpinnerModule } from "ngx-spinner";

@NgModule({
  declarations: [SyncModuleComponent],
  imports: [
    CommonModule,
    SyncModuleRoutingModule,
    NgxSpinnerModule,
  ]
})
export class SyncModuleModule { }
