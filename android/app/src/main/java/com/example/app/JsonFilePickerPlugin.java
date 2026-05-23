package com.example.app;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "JsonFilePicker")
public class JsonFilePickerPlugin extends Plugin {
  @PluginMethod
  public void saveJsonFile(PluginCall call) {
    String fileName = call.getString("fileName", "rpgorganizer.json");

    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("application/json");
    intent.putExtra(Intent.EXTRA_TITLE, fileName);

    startActivityForResult(call, intent, "saveJsonFileResult");
  }

  @PluginMethod
  public void openJsonFile(PluginCall call) {
    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("application/json");

    startActivityForResult(call, intent, "openJsonFileResult");
  }

  @ActivityCallback
  private void saveJsonFileResult(PluginCall call, ActivityResult result) {
    if (call == null) {
      return;
    }

    if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
      call.reject("Выбор файла отменён", "CANCELED");

      return;
    }

    Uri uri = result.getData().getData();
    String data = call.getString("data", "");

    try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri)) {
      if (stream == null) {
        call.reject("Не удалось открыть файл для записи");

        return;
      }

      stream.write(data.getBytes(StandardCharsets.UTF_8));
      JSObject ret = new JSObject();
      ret.put("uri", uri.toString());
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Не удалось записать JSON-файл", e);
    }
  }

  @ActivityCallback
  private void openJsonFileResult(PluginCall call, ActivityResult result) {
    if (call == null) {
      return;
    }

    if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
      call.reject("Выбор файла отменён", "CANCELED");

      return;
    }

    Uri uri = result.getData().getData();

    try (InputStream stream = getContext().getContentResolver().openInputStream(uri)) {
      if (stream == null) {
        call.reject("Не удалось открыть файл для чтения");

        return;
      }

      JSObject ret = new JSObject();
      ret.put("uri", uri.toString());
      ret.put("name", getFileName(uri));
      ret.put("data", readText(stream));
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Не удалось прочитать JSON-файл", e);
    }
  }

  private String readText(InputStream stream) throws Exception {
    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
    byte[] chunk = new byte[8192];
    int length;

    while ((length = stream.read(chunk)) != -1) {
      buffer.write(chunk, 0, length);
    }

    return buffer.toString(StandardCharsets.UTF_8.name());
  }

  private String getFileName(Uri uri) {
    try (Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null)) {
      if (cursor != null && cursor.moveToFirst()) {
        int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        if (index >= 0) {
          return cursor.getString(index);
        }
      }
    } catch (Exception e) {
    }

    return uri.getLastPathSegment();
  }
}
