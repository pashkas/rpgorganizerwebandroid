import { BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from "@angular/platform-browser";
import { NgModule, LOCALE_ID, Injectable } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AngularFireModule } from "angularfire2";
import { AngularFirestoreModule } from "angularfire2/firestore";
import { AngularFireAuthModule } from "angularfire2/auth";
import { environment } from "../environments/environment";
import { MainWindowComponent } from "./main-window/main-window.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AutofocusDirective } from "./autofocus.directive";
import { HttpClientModule } from "@angular/common/http";
import { SelectOnClickDirective } from "./select-on-click.directive";
import { LevelUpMsgComponent } from "./level-up-msg/level-up-msg.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { registerLocaleData } from "@angular/common";
import localeRu from "@angular/common/locales/ru";
import { MatProgressSpinnerModule, MatIconModule, MatBadgeModule, MatSlideToggleModule, MatChipsModule, MAT_FORM_FIELD_DEFAULT_OPTIONS, GestureConfig } from "@angular/material";
import { SharedModule } from "./shared/shared.module";
import { ArrSortDialogComponent } from "./arr-sort-dialog/arr-sort-dialog.component";
import { ProgressBarNumComponent } from "./shared/progress-bar-num/progress-bar-num.component";
import { TskTimeValDialogComponent } from "./tsk-time-val-dialog/tsk-time-val-dialog.component";
import { RestComponent } from "./rest/rest.component";
import { RouteReuseStrategy } from "@angular/router";
import { RouteReuseService } from "./route-reuse.service";
import { MatDividerModule } from "@angular/material/divider";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";
import { TimerCounterComponent } from "./main-window/timer-counter/timer-counter.component";
import { NgxMaterialTimepickerModule } from "ngx-material-timepicker";
import { FailModPipe } from "./fail-mod.pipe";
import { MainProgrDescPipe } from "./main-window/main-progr-desc.pipe";
import { ListBgPipe } from "./list-bg.pipe";
import { TaskTimerComponentComponent } from "./task-timer-component/task-timer-component.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { GameSettings } from "./GameSettings";
import { EraSettings } from "./game-settings/EraSettings";
import { CustomSwipeDirective } from "./customSwipe.directive";
import { TesSettingsV2 } from "./game-settings/TesSettingsV2";
import { TesSettings } from "./game-settings/TesSettings";

export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    swipe: { direction: Hammer.DIRECTION_ALL }, // Configure for vertical swipes
  };
}

registerLocaleData(localeRu, "ru");

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
    HammerModule,
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
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig,
    },
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
      // useClass: EraSettings,
      useClass: TesSettings,
    },
  ],
  bootstrap: [AppComponent],
  entryComponents: [LevelUpMsgComponent, ArrSortDialogComponent, TskTimeValDialogComponent, ConfirmationDialogComponent, TaskTimerComponentComponent],
  exports: [],
})
export class AppModule {}
