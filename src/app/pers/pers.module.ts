import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { PersRoutingModule } from "./pers-routing.module";
import { PersListComponent } from "../pers-list/pers-list.component";
import { ParamsChartComponent } from "../diary/params-chart/params-chart.component";
import { ChartsModule } from "ng2-charts";
import { DiaryComponent } from "../diary/diary.component";
import { DiaryShowComponent } from "../diary/diary-show/diary-show.component";
import { MatTabsModule } from "@angular/material/tabs";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { RarecolPipe } from "../rarecol.pipe";
import { MatCardModule, MatIconModule } from "@angular/material";
import { MatSelectModule } from "@angular/material/select";
import { CharacteristicDetailsComponent } from "../characteristic-details/characteristic-details.component";
import { AbilityDetailComponent } from "../ability-detail/ability-detail.component";
import { TaskDetailComponent } from "../task-detail/task-detail.component";
import { QwestDetailComponent } from "../qwest-detail/qwest-detail.component";
import { AddOrEditRevardComponent } from "../add-or-edit-revard/add-or-edit-revard.component";
import { OwlDateTimeModule, OwlNativeDateTimeModule } from "ng-pick-datetime";
import { OWL_DATE_TIME_LOCALE } from "ng-pick-datetime";
import { SharedModule } from "../shared/shared.module";
import { AbupcolPipe } from "../abupcol.pipe";
import { EditDiaryParamsComponent } from "../diary/edit-diary-params/edit-diary-params.component";
import { EnamiesComponent } from "../enamies/enamies.component";
import { SvgIconComponent } from "../svg-icon/svg-icon.component";
import { ReqvirementsComponent } from "../reqvirements/reqvirements.component";
import { ReqShowComponent } from "../reqvirements/req-show/req-show.component";
import { ReqEditComponent } from "../reqvirements/req-edit/req-edit.component";
import { ReqAddComponent } from "./req-add/req-add.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { ChangeCharactComponent } from "./change-charact/change-charact.component";
import { MatBadgeModule } from "@angular/material/badge";
import { ImageComponentComponent } from "../image-component/image-component.component";
import { MatChipsModule } from "@angular/material/chips";
import { AbHardnessComponent } from "./ab-hardness/ab-hardness.component";
import { AutosizeModule } from "ngx-autosize";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";
import { PersImportExportDialogComponent } from "../pers-import-export-dialog/pers-import-export-dialog.component";
import { AbilitySignsPipe } from "../ability-signs.pipe";
import { QuickAddAbilityComponent } from "./quick-add-ability/quick-add-ability.component";
import { ShopPipe } from "../shop.pipe";
import { RequirementsAddDialogComponent } from "./requirements-add-dialog/requirements-add-dialog.component";
import { TurnirTableComponent } from "../turnir-table/turnir-table.component";
import { LoginComponent } from "../login/login.component";
import { MatStepperModule } from "@angular/material/stepper";
import { PersMasterComponent } from "../sync-module/pers-master/pers-master.component";
import { FloorPipe } from "../floor.pipe";

@NgModule({
  declarations: [
    ReqvirementsComponent,
    ReqShowComponent,
    ReqEditComponent,
    DiaryShowComponent,
    PersListComponent,
    RarecolPipe,
    ParamsChartComponent,
    DiaryComponent,
    CharacteristicDetailsComponent,
    AbilityDetailComponent,
    TaskDetailComponent,
    QwestDetailComponent,
    AddOrEditRevardComponent,
    AbupcolPipe,
    EditDiaryParamsComponent,
    EnamiesComponent,
    SvgIconComponent,
    ReqAddComponent,
    ChangeCharactComponent,
    ImageComponentComponent,
    AbHardnessComponent,
    PersImportExportDialogComponent,
    AbilitySignsPipe,
    QuickAddAbilityComponent,
    ShopPipe,
    RequirementsAddDialogComponent,
    TurnirTableComponent,
    LoginComponent,
    PersMasterComponent,
    FloorPipe,
  ],
  imports: [
    SharedModule,
    MatStepperModule,
    NgxMaterialTimepickerModule,
    AutosizeModule,
    MatChipsModule,
    MatIconModule,
    MatBadgeModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatCardModule,
    CommonModule,
    PersRoutingModule,
    ChartsModule,
    MatTabsModule,
    MatProgressBarModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
  ],
  entryComponents: [
    AddOrEditRevardComponent,
    EditDiaryParamsComponent,
    ReqAddComponent,
    ChangeCharactComponent,
    PersImportExportDialogComponent,
    QuickAddAbilityComponent,
    RequirementsAddDialogComponent,
  ],
  providers: [{ provide: OWL_DATE_TIME_LOCALE, useValue: "ru" }],
})
export class PersModule {}
