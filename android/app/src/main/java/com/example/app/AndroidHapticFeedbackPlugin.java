package com.example.app;

import android.app.Activity;
import android.os.Build;
import android.view.HapticFeedbackConstants;
import android.view.View;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AndroidHapticFeedback")
public class AndroidHapticFeedbackPlugin extends Plugin {

  /**
   * Вызывает системный Android haptic feedback вместо прямой вибрации.
   */
  @PluginMethod
  public void perform(PluginCall call) {
    String type = call.getString("type", "tick");
    int feedbackType = getFeedbackType(type);
    Activity activity = getActivity();

    if (activity == null) {
      call.reject("Нет активного Android Activity");

      return;
    }

    activity.runOnUiThread(() -> {
      View view = getBridge().getWebView();
      if (view == null) {
        view = activity.getWindow().getDecorView();
      }

      if (view == null) {
        call.reject("Нет Android View для haptic feedback");

        return;
      }

      boolean performed = view.performHapticFeedback(feedbackType);
      JSObject result = new JSObject();
      result.put("performed", performed);
      call.resolve(result);
    });
  }

  /**
   * Подбирает системный тип отклика под игровое событие.
   */
  private int getFeedbackType(String type) {
    if ("success".equals(type)) {
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ? HapticFeedbackConstants.CONFIRM : HapticFeedbackConstants.VIRTUAL_KEY;
    }
    if ("error".equals(type)) {
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ? HapticFeedbackConstants.REJECT : HapticFeedbackConstants.LONG_PRESS;
    }
    if ("longPress".equals(type)) {
      return HapticFeedbackConstants.LONG_PRESS;
    }
    if ("contextClick".equals(type)) {
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? HapticFeedbackConstants.CONTEXT_CLICK : HapticFeedbackConstants.LONG_PRESS;
    }
    if ("tap".equals(type)) {
      return HapticFeedbackConstants.KEYBOARD_TAP;
    }

    return HapticFeedbackConstants.CLOCK_TICK;
  }
}
