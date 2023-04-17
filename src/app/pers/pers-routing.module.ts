import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { PersListComponent } from "../pers-list/pers-list.component";
import { CharacteristicDetailsComponent } from "../characteristic-details/characteristic-details.component";
import { AbilityDetailComponent } from "../ability-detail/ability-detail.component";
import { TaskDetailComponent } from "../task-detail/task-detail.component";
import { QwestDetailComponent } from "../qwest-detail/qwest-detail.component";
import { TurnirTableComponent } from "../turnir-table/turnir-table.component";
import { LoginComponent } from "../login/login.component";
import { PersMasterComponent } from "../sync-module/pers-master/pers-master.component";
const routes: Routes = [
  { path: "", component: PersListComponent, data: { key: "pers" } },
  { path: "characteristic/:id", component: CharacteristicDetailsComponent },
  { path: "characteristic/:id/:isEdit", component: CharacteristicDetailsComponent },
  { path: "ability/:id", component: AbilityDetailComponent },
  { path: "task/:id/:isEdit", component: TaskDetailComponent },
  { path: "qwest/:id", component: QwestDetailComponent },
  { path: "qwest/:id/:fromMain", component: QwestDetailComponent },
  { path: "turnirtable", component: TurnirTableComponent },
  { path: "login", component: LoginComponent },
  { path: "master", component: PersMasterComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersRoutingModule {}
