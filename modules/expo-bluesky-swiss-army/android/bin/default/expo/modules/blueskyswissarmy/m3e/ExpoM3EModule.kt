package expo.modules.blueskyswissarmy.m3e

import android.os.Handler
import android.os.Looper
import android.view.View
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// The native view can mount a few frames after JS gets its tag
private const val MAX_ATTEMPTS = 30
private const val RETRY_DELAY_MS = 32L

class ExpoM3EModule : Module() {
  private val handler = Handler(Looper.getMainLooper())

  override fun definition() =
    ModuleDefinition {
      Name("ExpoM3E")

      AsyncFunction("attachRefreshIndicator") { viewTag: Int ->
        attach(viewTag, 0)
      }.runOnQueue(Queues.MAIN)
    }

  private fun attach(
    viewTag: Int,
    attempt: Int,
  ) {
    val layout = findRefreshLayout(viewTag)
    if (layout != null) {
      LoadingIndicatorDrawable.install(layout)
    } else if (attempt < MAX_ATTEMPTS) {
      handler.postDelayed({ attach(viewTag, attempt + 1) }, RETRY_DELAY_MS)
    }
  }

  private fun findRefreshLayout(viewTag: Int): SwipeRefreshLayout? =
    try {
      appContext.findView<View>(viewTag) as? SwipeRefreshLayout
    } catch (_: Exception) {
      null
    }
}
