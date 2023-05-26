import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { MainWindowComponent } from "./main-window/main-window.component";

const routes: Routes = [
  { path: "", redirectTo: "main", pathMatch: "full" },
  { path: "main", component: MainWindowComponent },
  { path: "pers", loadChildren: () => import("./pers/pers.module").then((m) => m.PersModule) },
  { path: "mind-map", loadChildren: () => import("./mind-map/mind-map.module").then((m) => m.MindMapModule) },
  { path: "sync", loadChildren: () => import("./sync-module/sync-module.module").then((m) => m.SyncModuleModule) },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      onSameUrlNavigation: "reload",
      anchorScrolling: "enabled",
      scrollPositionRestoration: "enabled",
      scrollOffset: [0, 64],
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
