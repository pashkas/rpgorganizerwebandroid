import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiaryEditParamsComponent } from '../diary/diary-edit-params/diary-edit-params.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule, MatInputModule, MatSliderModule, MatGridListModule, MatGridTile, MatSelectModule } from '@angular/material'
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexLayoutModule } from "@angular/flex-layout";
import { PersChangesComponent } from '../pers-changes/pers-changes.component';
import { PersChangesItemComponent } from '../pers-changes-item/pers-changes-item.component';
import { AddItemDialogComponent } from '../add-item-dialog/add-item-dialog.component';
import { NgxMasonryModule } from 'ngx-masonry';
import { TimeValPipe } from './time-val.pipe';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { DatestringPipe } from './datestring.pipe';
import { AbHardnessPipe } from '../ab-hardness.pipe';
import { ImgBrokenDirective } from '../img-broken.directive';
import { RequrencePipe } from './requrence.pipe';
import { AbColorPipe } from './ab-color.pipe';
import { MainViewPipe } from './main-view.pipe';
import { MasonryPipe } from './masonry.pipe';

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
    MasonryPipe
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgxMaterialTimepickerModule,
    NgxMasonryModule,
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
  ],
  entryComponents:
    [
      DiaryEditParamsComponent,
      PersChangesComponent,
      AddItemDialogComponent,
    ],
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
    NgxMasonryModule,
    AbColorPipe,
    MainViewPipe,
    MasonryPipe
  ]
})
export class SharedModule {
}
