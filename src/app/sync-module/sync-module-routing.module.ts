import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SyncModuleComponent } from './sync-module.component';

const routes: Routes = [{ path: '', component: SyncModuleComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SyncModuleRoutingModule { }
