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
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "JsonFilePicker")
public class JsonFilePickerPlugin extends Plugin {
  private static final String PENDING_EXPORT_FILE = "pending-pers-export.json";

  @PluginMethod
  public void saveJsonFile(PluginCall call) {
    String fileName = call.getString("fileName", "rpgorganizer.json");
    String data = call.getString("data");

    if (data == null || data.length() == 0) {
      call.reject("Нет данных для записи JSON-файла");

      return;
    }

    try (OutputStream stream = new FileOutputStream(getPendingExportFile())) {
      stream.write(data.getBytes(StandardCharsets.UTF_8));
    } catch (Exception e) {
      call.reject("Не удалось подготовить JSON-файл", e);

      return;
    }

    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType("application/json");
    intent.putExtra(Intent.EXTRA_TITLE, fileName);

    startActivityForResult(call, intent, "saveJsonFileResult");
  }

  @PluginMethod
  public void clearJsonFileExport(PluginCall call) {
    deletePendingExportFile();
    call.resolve();
  }

  @PluginMethod
  public void appendJsonFileExport(PluginCall call) {
    String data = call.getString("data");

    if (data == null) {
      call.reject("Нет данных для записи JSON-файла");

      return;
    }

    try (OutputStream stream = new FileOutputStream(getPendingExportFile(), true)) {
      stream.write(data.getBytes(StandardCharsets.UTF_8));
      call.resolve();
    } catch (Exception e) {
      call.reject("Не удалось подготовить JSON-файл", e);
    }
  }

  @PluginMethod
  public void savePreparedJsonFile(PluginCall call) {
    File file = getPendingExportFile();

    if (!file.exists() || file.length() == 0) {
      call.reject("Нет данных для записи JSON-файла");

      return;
    }

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
      deletePendingExportFile();
      call.reject("Выбор файла отменён", "CANCELED");

      return;
    }

    Uri uri = result.getData().getData();
    File file = getPendingExportFile();

    if (!file.exists() || file.length() == 0) {
      deletePendingExportFile();
      call.reject("Нет данных для записи JSON-файла");

      return;
    }

    try (InputStream input = new FileInputStream(file);
         OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "wt")) {
      if (stream == null) {
        call.reject("Не удалось открыть файл для записи");

        return;
      }

      copy(input, stream);
      JSObject ret = new JSObject();
      ret.put("uri", uri.toString());
      call.resolve(ret);
    } catch (Exception e) {
      call.reject("Не удалось записать JSON-файл", e);
    } finally {
      deletePendingExportFile();
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

  private void copy(InputStream input, OutputStream output) throws Exception {
    byte[] chunk = new byte[8192];
    int length;

    while ((length = input.read(chunk)) != -1) {
      output.write(chunk, 0, length);
    }
  }

  private File getPendingExportFile() {

    return new File(getContext().getCacheDir(), PENDING_EXPORT_FILE);
  }

  private void deletePendingExportFile() {
    File file = getPendingExportFile();
    if (file.exists()) {
      file.delete();
    }
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
