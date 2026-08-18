import { ChangeDetectorRef, Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LocalImageService } from './local-image.service';

@Directive({
  selector: '[appImgBroken]',
  host: {
    '(error)':'updateUrl()',
    '[src]':'src'
   }
})
export class ImgBrokenDirective implements OnChanges {

  @Input() src:string;
  @Input() isLocalImage: boolean = false;
  @Input() localImageType: string;
  @Input() localImageId: string;
  private loadIndex = 0;

  constructor(private cdr: ChangeDetectorRef, private localImageSrv?: LocalImageService) {
  }

  async ngOnChanges(changes: SimpleChanges) {
    let currentLoadIndex = ++this.loadIndex;
    let fallbackSrc = this.src;

    if (!this.localImageSrv || this.isLocalImage === false || !this.localImageType || !this.localImageId) {
      return;
    }

    let localImage = await this.localImageSrv.read(this.localImageType, this.localImageId);
    if (currentLoadIndex !== this.loadIndex) {
      return;
    }

    this.src = localImage || fallbackSrc;
    this.cdr.markForCheck();
  }

  updateUrl() {
    this.src = 'assets/img/broken.jpg';
  }

}
