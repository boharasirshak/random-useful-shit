import AVFoundation
import ExpoModulesCore

// Renders the system voice (AVSpeechSynthesizer) to an audio file instead of the speaker, so the Reader can play
// sentences through a normal audio player: background playback, lock screen controls and speed come for free.
public class SpeechFileModule: Module {
  // Synthesizers must stay alive until their write finishes; one at a time is enough (the JS side renders in order).
  private var synth: AVSpeechSynthesizer?

  public func definition() -> ModuleDefinition {
    Name("SpeechFile")

    // Installed voices. Quality: "default", "enhanced" or "premium" (the ones users download in Settings).
    AsyncFunction("getVoices") { () -> [[String: Any]] in
      AVSpeechSynthesisVoice.speechVoices().map { v in
        let quality: String
        switch v.quality {
        case .premium: quality = "premium"
        case .enhanced: quality = "enhanced"
        default: quality = "default"
        }
        return ["id": v.identifier, "name": v.name, "language": v.language, "quality": quality, "installed": true]
      }
    }

    // iOS has no screen for voice downloads an app can open. The JS side explains the steps instead.
    AsyncFunction("openVoiceSettings") { () -> Bool in false }

    // Writes `text` spoken by `voiceId` (nil = system default) to `path` (.caf). Resolves with the duration in
    // seconds and word markers: where each word starts, in characters and seconds, for highlighting.
    AsyncFunction("synthesizeToFile") { (text: String, voiceId: String?, path: String, promise: Promise) in
      self.render(text: text, voiceId: voiceId, path: path, promise: promise)
    }
  }

  private func render(text: String, voiceId: String?, path: String, promise: Promise) {
    let url = URL(fileURLWithPath: path)
    try? FileManager.default.removeItem(at: url)
    let utterance = AVSpeechUtterance(string: text)
    if let id = voiceId, let voice = AVSpeechSynthesisVoice(identifier: id) { utterance.voice = voice }
    let synth = AVSpeechSynthesizer()
    self.synth = synth
    var file: AVAudioFile?
    var frames: Int64 = 0
    var sampleRate = 0.0
    var bytesPerFrame = 0.0
    var markers: [(offset: Double, at: Int)] = []
    var done = false
    let finish = { [weak self] in
      if done { return }
      done = true
      file = nil
      self?.synth = nil
      let duration = sampleRate > 0 ? Double(frames) / sampleRate : 0
      // byteSampleOffset is a byte offset into the stream; if that reads past the end, it was a sample offset.
      let last = markers.last?.offset ?? 0
      let divisor = bytesPerFrame > 0 && last / (sampleRate * bytesPerFrame) <= duration + 0.05 ? sampleRate * bytesPerFrame : sampleRate
      let words = markers.map { ["at": $0.at, "time": divisor > 0 ? $0.offset / divisor : 0] as [String: Any] }
      promise.resolve(["path": path, "duration": duration, "markers": words])
    }
    // The last callback carries an empty buffer; if it never comes (seen on some iOS builds), stop waiting.
    DispatchQueue.main.asyncAfter(deadline: .now() + 60) { if !done { finish() } }
    synth.write(utterance, toBufferCallback: { buffer in
      guard let pcm = buffer as? AVAudioPCMBuffer, pcm.frameLength > 0 else { finish(); return }
      if file == nil {
        sampleRate = pcm.format.sampleRate
        bytesPerFrame = Double(pcm.format.streamDescription.pointee.mBytesPerFrame)
        file = try? AVAudioFile(forWriting: url, settings: pcm.format.settings, commonFormat: pcm.format.commonFormat, interleaved: pcm.format.isInterleaved)
      }
      try? file?.write(from: pcm)
      frames += Int64(pcm.frameLength)
    }, toMarkerCallback: { list in
      for m in list where m.mark == .word { markers.append((Double(m.byteSampleOffset), m.textRange.location)) }
    })
  }
}
