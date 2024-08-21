import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "floor",
})
export class FloorPipe implements PipeTransform {
  transform(value: number, ...args: any[]): any {
    return Math.floor(value);
  }
}
