import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appImgBroken]',
  host: {
    '(error)':'updateUrl()',
    '[src]':'src'
   }
})
export class ImgBrokenDirective {

  @Input() src:string;

  updateUrl() {
    this.src = 'assets/img/ghostbusters.jpg';
  }

}
