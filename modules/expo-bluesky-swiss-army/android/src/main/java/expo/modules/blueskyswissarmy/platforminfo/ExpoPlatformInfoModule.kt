package expo.modules.blueskyswissarmy.platforminfo

import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private val ACCENT_TONES =
  listOf(0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000)

class ExpoPlatformInfoModule : Module() {
  override fun definition() =
    ModuleDefinition {
      Name("ExpoPlatformInfo")

      // See https://github.com/software-mansion/react-native-reanimated/blob/7df5fd57d608fe25724608835461cd925ff5151d/packages/react-native-reanimated/android/src/main/java/com/swmansion/reanimated/nativeProxy/NativeProxyCommon.java#L242
      Function("getIsReducedMotionEnabled") {
        val resolver = appContext.reactContext?.contentResolver ?: return@Function false
        val scale = Settings.Global.getString(resolver, Settings.Global.TRANSITION_ANIMATION_SCALE) ?: return@Function false

        try {
          return@Function scale.toFloat() == 0f
        } catch (_: Error) {
          return@Function false
        }
      }

      Function("getMaterialYouAccentColors") {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
          return@Function emptyMap<String, String>()
        }
        val context = appContext.reactContext ?: return@Function emptyMap<String, String>()
        val colors = mutableMapOf<String, String>()

        for (tone in ACCENT_TONES) {
          val id =
            context.resources.getIdentifier("system_accent1_$tone", "color", "android")
          if (id == 0) continue
          val color = context.getColor(id)
          colors[tone.toString()] = String.format("#%06X", color and 0xFFFFFF)
        }

        return@Function colors
      }
    }
}
