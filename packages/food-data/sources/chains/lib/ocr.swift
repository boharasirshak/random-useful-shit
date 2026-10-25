// OCR with the macOS Vision framework. Usage: swift ocr.swift img1.png img2.png ... → one JSON array of recognized lines per image, on stdout.
import Foundation
import Vision
import AppKit

var out: [[String]] = []
for path in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { out.append([]); continue }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  let lines = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }
  out.append(lines)
}
let data = try! JSONSerialization.data(withJSONObject: out)
print(String(data: data, encoding: .utf8)!)
