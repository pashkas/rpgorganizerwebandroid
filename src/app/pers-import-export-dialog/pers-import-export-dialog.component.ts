import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material";
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { PersService } from "../pers.service";

@Component({
  templateUrl: "./pers-import-export-dialog.component.html",
  styleUrls: ["./pers-import-export-dialog.component.css"],
})
export class PersImportExportDialogComponent implements OnInit {
  isImport: boolean = false;
  persData: string = "";
  fileName: string = "";
  message: string = "";
  error: string = "";
  isBusy: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData,
    private dialogRef: MatDialogRef<PersImportExportDialogComponent>,
    private srv: PersService,
  ) {}

  ngOnInit() {
    this.isImport = this.dialogData.isImport;
    if (!this.isImport) {
      this.persData = JSON.stringify(this.srv.pers$.value);
    } else {
      this.persData = "";
    }
  }

  /**
   * Экспорт персонажа в JSON-файл.
   */
  async exportToFile() {
    this.isBusy = true;
    this.error = "";
    this.message = "";
    this.fileName = this.getFileName();

    try {
      if (Capacitor.isNativePlatform()) {
        this.message = await this.shareNativeFile(this.fileName, this.persData);
      } else {
        this.downloadInBrowser(this.fileName, this.persData);
        this.message = "Файл подготовлен для скачивания.";
      }
    } catch (e) {
      this.error = "Не удалось сохранить файл персонажа.";
    } finally {
      this.isBusy = false;
    }
  }

  /**
   * Импорт персонажа из выбранного JSON-файла.
   */
  importFromFile(event: Event) {
    let input = event.target as HTMLInputElement;
    let file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.error = "";
    this.message = "";
    this.persData = "";
    this.fileName = file ? file.name : "";

    if (!file) {
      return;
    }

    this.isBusy = true;

    let reader = new FileReader();
    reader.onload = (e) => {
      this.persData = (e.target as FileReader).result as string;

      try {
        JSON.parse(this.persData);
        this.message = "Файл готов к загрузке.";
      } catch (err) {
        this.persData = "";
        this.error = "В файле нет корректного JSON персонажа.";
      }

      this.isBusy = false;
      input.value = "";
    };
    reader.onerror = () => {
      this.error = "Не удалось прочитать файл.";
      this.isBusy = false;
      input.value = "";
    };
    reader.readAsText(file);
  }

  confirmImport() {
    this.dialogRef.close(this.persData);
  }

  private getFileName(): string {
    let persName = this.srv.pers$.value && this.srv.pers$.value.name ? this.srv.pers$.value.name : "pers";
    let date = new Date().toISOString().slice(0, 10);

    return this.cleanFileName(persName) + "-" + date + ".json";
  }

  private cleanFileName(value: string): string {
    return (value || "pers").replace(/[^a-zA-Zа-яА-Я0-9_-]/g, "_");
  }

  private downloadInBrowser(fileName: string, data: string) {
    let blob = new Blob([data], { type: "application/json;charset=utf-8" });
    let url = window.URL.createObjectURL(blob);
    let link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private async shareNativeFile(fileName: string, data: string): Promise<string> {
    let result = await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    let canShare = await Share.canShare();

    if (!canShare.value) {
      return "Файл создан: " + result.uri;
    }

    await Share.share({
      title: "Персонаж RPG Organizer",
      text: "JSON-файл персонажа",
      files: [result.uri],
      dialogTitle: "Сохранить персонажа",
    });

    return "Файл передан в системное меню сохранения.";
  }
}
