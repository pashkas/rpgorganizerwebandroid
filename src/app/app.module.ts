import { registerLocaleData } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import localeRu from "@angular/common/locales/ru";
import { LOCALE_ID, NgModule } from "@angular/core";
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatBadgeModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, MatSlideToggleModule } from "@angular/material";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDividerModule } from "@angular/material/divider";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouteReuseStrategy } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";

import { AngularFireModule } from "angularfire2";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";

import { environment } from "../environments/environment";
import { GameSettings } from "./GameSettings";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ArrSortDialogComponent } from "./arr-sort-dialog/arr-sort-dialog.component";
import { AutofocusDirective } from "./autofocus.directive";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";
import { CustomSwipeDirective } from "./customSwipe.directive";
import { FailModPipe } from "./fail-mod.pipe";
import { EraSettings } from "./game-settings/EraSettings";
import { LevelUpMsgComponent } from "./level-up-msg/level-up-msg.component";
import { ListBgPipe } from "./list-bg.pipe";
import { MainProgrDescPipe } from "./main-window/main-progr-desc.pipe";
import { MainWindowComponent } from "./main-window/main-window.component";
import { TimerCounterComponent } from "./main-window/timer-counter/timer-counter.component";
import { RestComponent } from "./rest/rest.component";
import { RouteReuseService } from "./route-reuse.service";
import { SelectOnClickDirective } from "./select-on-click.directive";
import { ProgressBarNumComponent } from "./shared/progress-bar-num/progress-bar-num.component";
import { SharedModule } from "./shared/shared.module";
import { TaskTimerComponentComponent } from "./task-timer-component/task-timer-component.component";
import { TskTimeValDialogComponent } from "./tsk-time-val-dialog/tsk-time-val-dialog.component";
import { AngularFireAuthModule } from "angularfire2/auth";
import { AngularFirestoreModule } from "angularfire2/firestore";

@NgModule({
  declarations: [
    AppComponent,
    MainWindowComponent,
    AutofocusDirective,
    SelectOnClickDirective,
    LevelUpMsgComponent,
    ArrSortDialogComponent,
    ProgressBarNumComponent,
    TskTimeValDialogComponent,
    RestComponent,
    ConfirmationDialogComponent,
    TimerCounterComponent,
    FailModPipe,
    MainProgrDescPipe,
    ListBgPipe,
    TaskTimerComponentComponent,
    CustomSwipeDirective,
  ],
  imports: [
    MatChipsModule,
    MatCheckboxModule,
    NgxMaterialTimepickerModule,
    MatBadgeModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AppRoutingModule,
    HttpClientModule,
    MatSlideToggleModule,
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: environment.production }),
  ],
  providers: [
    { provide: LOCALE_ID, useValue: "ru" },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        subscriptSizing: "dynamic",
      },
    },
    {
      provide: RouteReuseStrategy,
      useClass: RouteReuseService,
    },
    {
      provide: GameSettings,
      useClass: EraSettings,
      // useClass: TessSettingsEXPA,
    },
  ],
  bootstrap: [AppComponent],
  entryComponents: [LevelUpMsgComponent, ArrSortDialogComponent, TskTimeValDialogComponent, ConfirmationDialogComponent, TaskTimerComponentComponent],
  exports: [],
})
export class AppModule {}

registerLocaleData(localeRu, "ru");
