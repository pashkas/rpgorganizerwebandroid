import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "filterByProperty",
  pure: false
})
export class FilterByPropertyPipe implements PipeTransform {
  transform(items: any[], propertyName: string, value: any): any[] {
    if (!items || !propertyName) return items;

    return items.filter((item) => item[propertyName] === value);
  }
}
