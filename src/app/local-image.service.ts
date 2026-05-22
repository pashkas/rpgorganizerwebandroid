import { Injectable } from "@angular/core";
import { Directory, Filesystem } from "@capacitor/filesystem";

@Injectable({
  providedIn: "root",
})
export class LocalImageService {
  private readonly rootDir = "local-images";
  private readonly maxSide = 720;
  private readonly quality = 0.85;

  async save(type: string, id: string, file: File): Promise<string> {
    let dataUrl = await this.resize(file);
    let base64 = this.getBase64(dataUrl);
    let path = this.getPath(type, id);

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });

    return dataUrl;
  }

  async read(type: string, id: string): Promise<string> {
    if (!type || !id) {
      return null;
    }

    try {
      let file = await Filesystem.readFile({
        path: this.getPath(type, id),
        directory: Directory.Data,
      });

      return "data:image/webp;base64," + file.data;
    } catch (e) {
      return null;
    }
  }

  async delete(type: string, id: string): Promise<void> {
    if (!type || !id) {
      return;
    }

    try {
      await Filesystem.deleteFile({
        path: this.getPath(type, id),
        directory: Directory.Data,
      });
    } catch (e) {
    }
  }

  private getPath(type: string, id: string): string {
    return this.rootDir + "/" + this.cleanPathPart(type) + "/" + this.cleanPathPart(id) + ".webp";
  }

  private cleanPathPart(value: string): string {
    return (value || "").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  private resize(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (e) => this.resizeDataUrl((e.target as FileReader).result as string).then(resolve).catch(reject);
      reader.onerror = () => reject();
      reader.readAsDataURL(file);
    });
  }

  private resizeDataUrl(dataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let image = new Image();
      image.onload = () => {
        let ratio = Math.min(1, this.maxSide / image.width, this.maxSide / image.height);
        let canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        let context = canvas.getContext("2d");
        if (!context) {
          resolve(dataUrl);

          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        if (!canvas.toBlob) {
          resolve(canvas.toDataURL("image/webp", this.quality));

          return;
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(canvas.toDataURL("image/webp", this.quality));

            return;
          }

          this.blobToDataUrl(blob).then(resolve).catch(reject);
        }, "image/webp", this.quality);
      };
      image.onerror = () => reject();
      image.src = dataUrl;
    });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (e) => resolve((e.target as FileReader).result as string);
      reader.onerror = () => reject();
      reader.readAsDataURL(blob);
    });
  }

  private getBase64(dataUrl: string): string {
    let commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) {
      return dataUrl;
    }

    return dataUrl.substr(commaIndex + 1);
  }
}
