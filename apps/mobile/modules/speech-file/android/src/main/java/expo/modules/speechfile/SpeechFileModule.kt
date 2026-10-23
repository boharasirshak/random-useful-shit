package expo.modules.speechfile

import android.content.Intent
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.ConcurrentHashMap

// Renders the system voice (TextToSpeech) to a WAV file, so the Reader plays sentences through a normal audio player.
class SpeechFileModule : Module() {
  private var tts: TextToSpeech? = null
  private var ready = false
  private val waiting = mutableListOf<(Boolean) -> Unit>()
  private val pending = ConcurrentHashMap<String, Pair<Promise, String>>()

  override fun definition() = ModuleDefinition {
    Name("SpeechFile")

    AsyncFunction("getVoices") { promise: Promise ->
      engine { ok ->
        val voices = if (ok) runCatching { tts?.voices }.getOrNull().orEmpty() else emptySet<Voice>()
        promise.resolve(voices.filter { !it.isNetworkConnectionRequired }.map {
          mapOf(
            "id" to it.name, "name" to it.name, "language" to it.locale.toLanguageTag(),
            "quality" to if (it.quality >= Voice.QUALITY_HIGH) "enhanced" else "default",
            "installed" to !it.features.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED),
          )
        })
      }
    }

    // Opens the system text-to-speech settings, where Google TTS installs more voices.
    AsyncFunction("openVoiceSettings") { promise: Promise ->
      val intent = Intent("com.android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      val activity = appContext.currentActivity
      if (activity == null) promise.resolve(false)
      else { activity.startActivity(intent); promise.resolve(true) }
    }

    AsyncFunction("synthesizeToFile") { text: String, voiceId: String?, path: String, promise: Promise ->
      engine { ok ->
        val engine = tts
        if (!ok || engine == null) return@engine promise.reject("E_TTS", "Text-to-speech is not available", null)
        engine.voice = voiceId?.let { id -> runCatching { engine.voices?.find { it.name == id } }.getOrNull() } ?: engine.defaultVoice
        val id = "s${System.nanoTime()}"
        pending[id] = promise to path
        val out = File(path).also { it.parentFile?.mkdirs(); it.delete() }
        if (engine.synthesizeToFile(text, Bundle(), out, id) != TextToSpeech.SUCCESS) {
          pending.remove(id)
          promise.reject("E_TTS", "Could not start synthesis", null)
        }
      }
    }

    OnDestroy { tts?.shutdown(); tts = null }
  }

  // Runs `block` once the engine has started (it starts on first use).
  private fun engine(block: (Boolean) -> Unit) {
    if (tts != null) {
      if (ready) block(true) else synchronized(waiting) { waiting.add(block) }
      return
    }
    val context = appContext.reactContext ?: return block(false)
    synchronized(waiting) { waiting.add(block) }
    val engine = TextToSpeech(context) { status ->
      ready = status == TextToSpeech.SUCCESS
      val blocks = synchronized(waiting) { waiting.toList().also { waiting.clear() } }
      blocks.forEach { it(ready) }
    }
    engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(id: String) {}
      override fun onDone(id: String) {
        val (promise, path) = pending.remove(id) ?: return
        promise.resolve(mapOf("path" to path, "duration" to wavDuration(path), "markers" to emptyList<Any>()))
      }
      @Deprecated("Deprecated in Java")
      override fun onError(id: String) { pending.remove(id)?.first?.reject("E_TTS", "Synthesis failed", null) }
      override fun onError(id: String, code: Int) { pending.remove(id)?.first?.reject("E_TTS", "Synthesis failed ($code)", null) }
    })
    tts = engine
  }

  // Duration from the WAV header: data bytes / byte rate.
  private fun wavDuration(path: String): Double = try {
    RandomAccessFile(path, "r").use { f ->
      val header = ByteArray(44)
      f.readFully(header)
      val byteRate = ByteBuffer.wrap(header, 28, 4).order(ByteOrder.LITTLE_ENDIAN).int
      if (byteRate > 0) (f.length() - 44).toDouble() / byteRate else 0.0
    }
  } catch (e: Exception) { 0.0 }
}
