import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { SyncModuleRoutingModule } from "./sync-module-routing.module";
import { SyncModuleComponent } from "./sync-module.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatStepperModule } from "@angular/material/stepper";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

@NgModule({
  declarations: [SyncModuleComponent],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatStepperModule, CommonModule, SyncModuleRoutingModule],
})
export class SyncModuleModule {}
