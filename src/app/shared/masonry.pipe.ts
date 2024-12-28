import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "masonry",
})
export class MasonryPipe implements PipeTransform {
  transform(data: any, type: string): any {
    return data.pers.skillsGlobal;
    
    if (type == "skills") {
      let dt = [...data.pers.skillsGlobal];
      let cc = data.masonryColumnCount;

      for (let i = 0; i < dt.length; i++) {
        const el = dt[i];
        el.masonryIdx = i % cc;
      }

      dt.sort((a, b) => a.masonryIdx - b.masonryIdx);

      return dt;
    }

    return [];
  }
}
