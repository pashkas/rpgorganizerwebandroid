import { Overlay } from "@angular/cdk/overlay";
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material";
import { AddItemDialogComponent } from "../add-item-dialog/add-item-dialog.component";
import { LocalImageService } from "../local-image.service";
import { PersService } from "../pers.service";

@Component({
  selector: 'app-image-component',
  templateUrl: './image-component.component.html',
  styleUrls: ['./image-component.component.css']
})
export class ImageComponentComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() dataForm: FormControl;
  @Output() dataChange = new EventEmitter<any>();
  @Input() isCanEdit;
  @Input() isPers: boolean = false;
  @Input() isRev: boolean = false;
  @Input() isQwest: boolean = false;
  @Input() localImageType: string;
  @Input() localImageId: string;
  showData: any;

  constructor(private srv: PersService, public dialog: MatDialog, private overlay: Overlay, private localImageSrv: LocalImageService) { }

  ngOnInit() {
    this.refreshImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.refreshImage();
  }

  setImg() {
    if (!this.isCanEdit) {
      return;
    }

    let wasOpen = this.srv.isDialogOpen;
    if (!wasOpen) {
      this.srv.isDialogOpen = true;
    }
    const dialogRef = this.dialog.open(AddItemDialogComponent, {
      panelClass: 'my-big',
      data: { header: 'Выберите изображение', text: '', isGallery: true, isPers: this.isPers, isRev: this.isRev, isQwest: this.isQwest, isDeviceEnable: this.isLocalImageEnable() },
      backdropClass: 'backdrop',
      maxWidth: undefined,
      maxHeight: undefined,
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    dialogRef.afterClosed()
      .subscribe(async result => {
        try {
          if (result) {
            if (result.isDeviceImage) {
              await this.saveLocalImage(result.file);
            } else {
              await this.deleteLocalImage();
              this.showData = result;
              this.dataChange.emit(result);
            }
          }
        } finally {
          if (!wasOpen) {
            this.srv.isDialogOpen = false;
          }
        }
      });
  }

  private async refreshImage() {
    this.showData = this.data;
    if (!this.isLocalImageEnable()) {
      return;
    }

    let localImage = await this.localImageSrv.read(this.localImageType, this.localImageId);
    if (localImage) {
      this.showData = localImage;
    }
  }

  private async saveLocalImage(file: File) {
    if (!this.isLocalImageEnable()) {
      return;
    }

    try {
      this.showData = await this.localImageSrv.save(this.localImageType, this.localImageId, file);
    } catch (e) {
      this.showData = this.data;
    }
  }

  private async deleteLocalImage() {
    if (!this.isLocalImageEnable()) {
      return;
    }

    await this.localImageSrv.delete(this.localImageType, this.localImageId);
  }

  private isLocalImageEnable(): boolean {
    return !!this.localImageType && !!this.localImageId;
  }
}
