import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DiaryEditParamsComponent } from "../diary/diary-edit-params/diary-edit-params.component";
import { MatDialogModule } from "@angular/material/dialog";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatListModule, MatInputModule, MatSliderModule, MatGridListModule, MatGridTile, MatSelectModule, MatChipsModule } from "@angular/material";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { FlexLayoutModule } from "@angular/flex-layout";
import { PersChangesComponent } from "../pers-changes/pers-changes.component";
import { PersChangesItemComponent } from "../pers-changes-item/pers-changes-item.component";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { TimeValPipe } from "./time-val.pipe";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";
import { DatestringPipe } from "./datestring.pipe";
import { AbHardnessPipe } from "../ab-hardness.pipe";
import { ImgBrokenDirective } from "../img-broken.directive";
import { RequrencePipe } from "./requrence.pipe";
import { AbColorPipe } from "./ab-color.pipe";
import { MainViewPipe } from "./main-view.pipe";
import { FilterByPropertyPipe } from "../filter-by-property.pipe";
import { CustomSwipeDirective } from "../customSwipe.directive";

@NgModule({
  declarations: [
    DiaryEditParamsComponent,
    PersChangesComponent,
    PersChangesItemComponent,
    AddItemDialogComponent,
    TimeValPipe,
    DatestringPipe,
    AbHardnessPipe,
    ImgBrokenDirective,
    RequrencePipe,
    AbColorPipe,
    MainViewPipe,
    FilterByPropertyPipe,
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaterialTimepickerModule,
    MatGridListModule,
    CommonModule,
    MatDialogModule,
    MatListModule,
    MatInputModule,
    MatSliderModule,
    MatProgressBarModule,
    MatButtonModule,
    DragDropModule,
    FlexLayoutModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatButtonToggleModule,
  ],
  entryComponents: [DiaryEditParamsComponent, PersChangesComponent, AddItemDialogComponent],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    ImgBrokenDirective,
    DiaryEditParamsComponent,
    PersChangesItemComponent,
    MatDialogModule,
    MatListModule,
    MatInputModule,
    MatSliderModule,
    MatProgressBarModule,
    MatButtonModule,
    DragDropModule,
    FlexLayoutModule,
    PersChangesComponent,
    AddItemDialogComponent,
    TimeValPipe,
    MatSelectModule,
    DatestringPipe,
    AbHardnessPipe,
    RequrencePipe,
    AbColorPipe,
    MainViewPipe,
    FilterByPropertyPipe,
    MatCheckboxModule,
    MatButtonToggleModule,
  ],
})
export class SharedModule {}
