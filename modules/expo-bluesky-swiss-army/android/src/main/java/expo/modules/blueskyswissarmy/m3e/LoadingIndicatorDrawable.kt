package expo.modules.blueskyswissarmy.m3e

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.drawable.Drawable
import android.os.SystemClock
import android.widget.ImageView
import androidx.swiperefreshlayout.widget.CircularProgressDrawable
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import kotlin.math.PI
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

private fun interface Shape {
  fun radius(theta: Double): Double
}

private fun lobed(
  lobes: Int,
  depth: Double,
) = Shape { theta -> 1.0 - depth * (1.0 - cos(lobes * theta)) / 2.0 }

private fun superellipse(
  b: Double,
  n: Double,
  tilt: Double,
) = Shape { theta ->
  val phi = theta - tilt
  (abs(cos(phi)).pow(n) + (abs(sin(phi)) / b).pow(n)).pow(-1.0 / n)
}

private val CIRCLE = Shape { 1.0 }
private val SOFT_BURST = lobed(10, 0.18)

private val SEQUENCE =
  listOf(
    SOFT_BURST,
    lobed(9, 0.12),
    lobed(5, 0.16),
    superellipse(0.6, 2.6, PI / 4),
    lobed(8, 0.14),
    lobed(4, 0.2),
    superellipse(0.75, 2.0, -PI / 4),
  )

private const val SAMPLES = 144
private const val MORPH_MS = 650L
private const val FULL_ROTATION_MS = 4666.0

private const val INDICATOR_SCALE = 38f / 48f

private const val MAX_PULL_TRIM = 0.8f

private const val SPRING_DAMPING = 0.6
private val SPRING_OMEGA = sqrt(200.0)
private val SPRING_OMEGA_D = SPRING_OMEGA * sqrt(1 - SPRING_DAMPING * SPRING_DAMPING)

private fun spring(seconds: Double): Double {
  val decay = exp(-SPRING_DAMPING * SPRING_OMEGA * seconds)
  return 1 -
    decay *
    (
      cos(SPRING_OMEGA_D * seconds) +
        SPRING_DAMPING * SPRING_OMEGA / SPRING_OMEGA_D * sin(SPRING_OMEGA_D * seconds)
    )
}

class LoadingIndicatorDrawable private constructor(
  private val source: CircularProgressDrawable,
) : Drawable(),
  Drawable.Callback {
  private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
  private val path = Path()
  private var ownAlpha = 255
  private var indeterminateStart = -1L
  private var lastElapsed = 0L

  override fun draw(canvas: Canvas) {
    val b = bounds
    if (b.isEmpty) return

    val color = source.colorSchemeColors.firstOrNull() ?: Color.BLACK
    paint.color = color
    paint.alpha = Color.alpha(color) * source.alpha / 255 * ownAlpha / 255

    val cx = b.exactCenterX()
    val cy = b.exactCenterY()
    val radius = min(b.width(), b.height()) / 2f * INDICATOR_SCALE

    if (source.isRunning) {
      val now = SystemClock.uptimeMillis()
      if (indeterminateStart < 0) indeterminateStart = now
      lastElapsed = now - indeterminateStart
      drawIndeterminate(canvas, cx, cy, radius, lastElapsed)
      invalidateSelf()
    } else if (indeterminateStart >= 0 && source.endTrim <= 0f) {
      drawIndeterminate(canvas, cx, cy, radius, lastElapsed)
    } else {
      indeterminateStart = -1
      val progress = (source.endTrim / MAX_PULL_TRIM).coerceIn(0f, 1f).toDouble()
      buildPath(
        CIRCLE,
        SOFT_BURST,
        progress,
        -progress * PI,
        cx,
        cy,
        radius * (0.6f + 0.4f * progress.toFloat()),
      )
      canvas.drawPath(path, paint)
    }
  }

  private fun drawIndeterminate(
    canvas: Canvas,
    cx: Float,
    cy: Float,
    radius: Float,
    elapsed: Long,
  ) {
    val step = (elapsed / MORPH_MS).toInt()
    val morph = spring((elapsed % MORPH_MS) / 1000.0)
    val rotationDegrees = elapsed * 360.0 / FULL_ROTATION_MS + (step + morph) * 90.0
    buildPath(
      SEQUENCE[step % SEQUENCE.size],
      SEQUENCE[(step + 1) % SEQUENCE.size],
      morph,
      Math.toRadians(rotationDegrees),
      cx,
      cy,
      radius,
    )
    canvas.drawPath(path, paint)
  }

  private fun buildPath(
    from: Shape,
    to: Shape,
    fraction: Double,
    rotation: Double,
    cx: Float,
    cy: Float,
    radius: Float,
  ) {
    path.rewind()
    for (i in 0 until SAMPLES) {
      val theta = 2 * PI * i / SAMPLES
      val a = from.radius(theta)
      val r = (a + (to.radius(theta) - a) * fraction).coerceAtLeast(0.0) * radius
      val x = cx + (r * cos(theta + rotation)).toFloat()
      val y = cy + (r * sin(theta + rotation)).toFloat()
      if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    path.close()
  }

  override fun setAlpha(alpha: Int) {
    ownAlpha = alpha
    invalidateSelf()
  }

  override fun getAlpha(): Int = ownAlpha

  override fun setColorFilter(colorFilter: ColorFilter?) {
    paint.colorFilter = colorFilter
    invalidateSelf()
  }

  @Deprecated("Deprecated in Java")
  override fun getOpacity(): Int = PixelFormat.TRANSLUCENT

  override fun invalidateDrawable(who: Drawable) = invalidateSelf()

  override fun scheduleDrawable(
    who: Drawable,
    what: Runnable,
    `when`: Long,
  ) = scheduleSelf(what, `when`)

  override fun unscheduleDrawable(
    who: Drawable,
    what: Runnable,
  ) = unscheduleSelf(what)

  companion object {
    fun install(layout: SwipeRefreshLayout) {
      for (i in 0 until layout.childCount) {
        val view = layout.getChildAt(i) as? ImageView ?: continue
        val current = view.drawable
        if (current is LoadingIndicatorDrawable) return
        if (current is CircularProgressDrawable) {
          val indicator = LoadingIndicatorDrawable(current)
          view.setImageDrawable(indicator)
          // setImageDrawable detached the spinner, so forward its redraws
          current.callback = indicator
          return
        }
      }
    }
  }
}
