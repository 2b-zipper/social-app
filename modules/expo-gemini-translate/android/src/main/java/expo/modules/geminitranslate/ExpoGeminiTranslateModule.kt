package expo.modules.geminitranslate

import android.os.Build
import android.util.Log
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import com.google.mlkit.genai.prompt.TextPart
import com.google.mlkit.genai.prompt.generateContentRequest
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

private const val TAG = "ExpoGeminiTranslate"

private const val STATUS_UNAVAILABLE = "unavailable"

private const val PROMPT_TEMPLATE =
  "Translate the text inside <text> into %s.\n" +
    "Reply with the translation alone - no notes, no explanation, no preamble, " +
    "and do not repeat the tags.\n" +
    "Preserve the meaning, tone and register of the original as closely as you " +
    "can, and translate all of it, including anything inside quotation marks.\n" +
    "Reproduce the original punctuation, quotation marks, emoji, @handles, " +
    "#hashtags and URLs as they appear. Do not add quotation marks of your own." +
    "\n\n<text>\n%s\n</text>"

class ExpoGeminiTranslateModule : Module() {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private var model: GenerativeModel? = null

  @Synchronized
  private fun requireModel(): GenerativeModel =
    model ?: Generation.getClient().also { model = it }

  override fun definition() = ModuleDefinition {
    Name("ExpoGeminiTranslate")

    AsyncFunction("getStatus") { promise: Promise ->
      scope.launch {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
          promise.resolve(STATUS_UNAVAILABLE)
          return@launch
        }
        try {
          promise.resolve(statusName(requireModel().checkStatus()))
        } catch (e: Throwable) {
          Log.w(TAG, "checkStatus failed", e)
          promise.resolve(STATUS_UNAVAILABLE)
        }
      }
    }

    AsyncFunction("translate") { text: String, targetLanguage: String, promise: Promise ->
      scope.launch {
        try {
          val generativeModel = requireModel()

          if (generativeModel.checkStatus() == FeatureStatus.DOWNLOADABLE) {
            downloadModel(generativeModel)
          }

          val response = generativeModel.generateContent(
            generateContentRequest(
              TextPart(PROMPT_TEMPLATE.format(targetLanguage, text)),
            ) {
              temperature = 0f
              topK = 1
            },
          )
          val translated = response.candidates.firstOrNull()?.text?.let(::stripTags)

          if (translated.isNullOrEmpty()) {
            promise.reject(
              CodedException(
                code = "EMPTY_RESULT",
                message = "Gemini Nano returned no text",
                cause = null,
              ),
            )
          } else {
            promise.resolve(translated)
          }
        } catch (e: Throwable) {
          Log.w(TAG, "translate failed", e)
          promise.reject(
            CodedException(
              code = "GENERATION_FAILED",
              message = e.message ?: e.toString(),
              cause = e,
            ),
          )
        }
      }
    }

    OnDestroy {
      scope.cancel()
      model?.close()
      model = null
    }
  }

  private fun stripTags(text: String) =
    text.trim().removeSurrounding("<text>", "</text>").trim()

  private suspend fun downloadModel(generativeModel: GenerativeModel) {
    generativeModel.download().collect { status ->
      when (status) {
        is DownloadStatus.DownloadStarted -> Log.d(TAG, "Gemini Nano download started")
        is DownloadStatus.DownloadProgress ->
          Log.d(TAG, "Gemini Nano ${status.totalBytesDownloaded} bytes downloaded")
        is DownloadStatus.DownloadCompleted -> Log.d(TAG, "Gemini Nano download complete")
        is DownloadStatus.DownloadFailed -> throw status.e
      }
    }
  }

  private fun statusName(status: Int) = when (status) {
    FeatureStatus.AVAILABLE -> "available"
    FeatureStatus.DOWNLOADABLE -> "downloadable"
    FeatureStatus.DOWNLOADING -> "downloading"
    else -> STATUS_UNAVAILABLE
  }
}
