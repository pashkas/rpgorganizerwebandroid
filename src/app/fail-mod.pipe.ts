import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "failMod",
})
export class FailModPipe implements PipeTransform {
  transform(value: number, ...args: any[]): any {
    if (value && value > 0) {
      let mod = value + 1;
      return "x" + mod;
    } else {
      return null;
    }
  }
}
