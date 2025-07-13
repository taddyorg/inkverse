import UserNotifications
import UIKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent =
      (request.content.mutableCopy() as? UNMutableNotificationContent)

    if let bestAttemptContent = bestAttemptContent {
      // Debug logging
      print("NotificationService: ⚡️ NOTIFICATION SERVICE STARTED ⚡️")
      print("NotificationService: Received notification with userInfo: \(request.content.userInfo)")
      
      // Add a marker to the notification to confirm the service ran
      bestAttemptContent.title = "[NS] \(bestAttemptContent.title)"
      
      // Try multiple possible locations for the image URL
      var imageUrlString: String?
      
      // Check for richContent.image (server structure)
      if let richContent = request.content.userInfo["richContent"] as? [String: Any],
         let image = richContent["image"] as? String {
        imageUrlString = image
        print("NotificationService: Found image URL in richContent.image: \(image)")
      }
      // Check for body._richContent.image (possible iOS transformation)
      else if let body = request.content.userInfo["body"] as? [String: Any],
              let richContent = body["_richContent"] as? [String: Any],
              let image = richContent["image"] as? String {
        imageUrlString = image
        print("NotificationService: Found image URL in body._richContent.image: \(image)")
      }
      // Check for _richContent.image (another possible location)
      else if let richContent = request.content.userInfo["_richContent"] as? [String: Any],
              let image = richContent["image"] as? String {
        imageUrlString = image
        print("NotificationService: Found image URL in _richContent.image: \(image)")
      }
      
      if let imageUrlString = imageUrlString,
         let imageUrl = URL(string: imageUrlString) {
        print("NotificationService: Downloading image from URL: \(imageUrl)")
        downloadAndAttachImage(url: imageUrl, to: bestAttemptContent) { content in
          contentHandler(content)
        }
      } else {
        print("NotificationService: No image URL found in notification payload")
        contentHandler(bestAttemptContent)
      }
    }
  }

  private func downloadAndAttachImage(
    url: URL,
    to content: UNMutableNotificationContent,
    completion: @escaping (UNNotificationContent) -> Void
  ) {
    print("NotificationService: Starting download from URL: \(url)")
    
    let task = URLSession.shared.downloadTask(with: url) { temporaryFileLocation, response, error in
      guard let temporaryFileLocation = temporaryFileLocation else {
        print("NotificationService: Failed to download image. Error: \(error?.localizedDescription ?? "Unknown error")")
        completion(content)
        return
      }
      
      // Log response details
      if let httpResponse = response as? HTTPURLResponse {
        print("NotificationService: HTTP Status: \(httpResponse.statusCode)")
        print("NotificationService: Content-Type: \(httpResponse.allHeaderFields["Content-Type"] ?? "unknown")")
      }

      let fileManager = FileManager.default
      let tempDirectory = URL(fileURLWithPath: NSTemporaryDirectory())
      let targetFileName = UUID().uuidString + ".jpg"
      let targetUrl = tempDirectory.appendingPathComponent(targetFileName)

      try? fileManager.removeItem(at: targetUrl)

      do {
        // Read the downloaded data
        let imageData = try Data(contentsOf: temporaryFileLocation)
        print("NotificationService: Downloaded image data of size: \(imageData.count) bytes")
        
        // Try to convert the image to JPEG (handles WebP and other formats)
        if let convertedData = self.convertImageDataToJPEG(imageData) {
          print("NotificationService: Successfully converted image to JPEG, size: \(convertedData.count) bytes")
          try convertedData.write(to: targetUrl)
        } else {
          print("NotificationService: Failed to convert image using ImageIO")
          // Fallback: try UIImage conversion for supported formats
          if let image = UIImage(data: imageData),
             let jpegData = image.jpegData(compressionQuality: 0.85) {
            print("NotificationService: Fallback UIImage conversion successful")
            try jpegData.write(to: targetUrl)
          } else {
            print("NotificationService: All conversion attempts failed, skipping attachment")
            completion(content)
            return
          }
        }

        // Create attachment
        let attachment = try UNNotificationAttachment(
          identifier: "image",
          url: targetUrl,
          options: nil
        )

        content.attachments = [attachment]
        print("NotificationService: Successfully attached image to notification")
      } catch {
        print("NotificationService: Error processing attachment: \(error.localizedDescription)")
      }

      completion(content)
    }

    task.resume()
  }
  
  private func convertImageDataToJPEG(_ data: Data) -> Data? {
    // Check if this is a WebP image by looking at the file signature
    let isWebP = isWebPImage(data)
    print("NotificationService: Converting image, is WebP: \(isWebP), data size: \(data.count)")
    
    // First, try to create image source without type hints
    guard let imageSource = CGImageSourceCreateWithData(data as CFData, nil) else {
      print("NotificationService: Failed to create CGImageSource from data")
      return nil
    }
    
    // Get the image type
    if let imageType = CGImageSourceGetType(imageSource) as String? {
      print("NotificationService: Detected image type: \(imageType)")
    }
    
    // Get image properties to check format
    if let properties = CGImageSourceCopyProperties(imageSource, nil) as? [String: Any] {
      print("NotificationService: Image properties: \(properties.keys.joined(separator: ", "))")
    }
    
    // Try to create CGImage
    guard let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
      print("NotificationService: Failed to create CGImage from source")
      return nil
    }
    
    print("NotificationService: Successfully created CGImage, size: \(cgImage.width)x\(cgImage.height)")
    
    // Convert to UIImage
    let uiImage = UIImage(cgImage: cgImage)
    
    // Try to maintain aspect ratio and limit size for notifications
    let maxSize: CGFloat = 1024
    let scale = min(maxSize / CGFloat(cgImage.width), maxSize / CGFloat(cgImage.height), 1.0)
    
    if scale < 1.0 {
      let newSize = CGSize(
        width: CGFloat(cgImage.width) * scale,
        height: CGFloat(cgImage.height) * scale
      )
      
      print("NotificationService: Resizing image from \(cgImage.width)x\(cgImage.height) to \(Int(newSize.width))x\(Int(newSize.height))")
      
      UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
      uiImage.draw(in: CGRect(origin: .zero, size: newSize))
      let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
      UIGraphicsEndImageContext()
      
      if let jpegData = resizedImage?.jpegData(compressionQuality: 0.85) {
        print("NotificationService: Successfully converted to JPEG, final size: \(jpegData.count) bytes")
        return jpegData
      }
    }
    
    if let jpegData = uiImage.jpegData(compressionQuality: 0.85) {
      print("NotificationService: Successfully converted to JPEG, final size: \(jpegData.count) bytes")
      return jpegData
    }
    
    print("NotificationService: Failed to convert to JPEG")
    return nil
  }
  
  private func isWebPImage(_ data: Data) -> Bool {
    // WebP files start with "RIFF" followed by file size, then "WEBP"
    guard data.count >= 12 else { return false }
    
    let riffBytes = data.subdata(in: 0..<4)
    let webpBytes = data.subdata(in: 8..<12)
    
    let riffString = String(data: riffBytes, encoding: .ascii)
    let webpString = String(data: webpBytes, encoding: .ascii)
    
    return riffString == "RIFF" && webpString == "WEBP"
  }

  override func serviceExtensionTimeWillExpire() {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    if let contentHandler = contentHandler,
      let bestAttemptContent = bestAttemptContent {
      print("NotificationService: Service extension time expired, delivering best attempt")
      contentHandler(bestAttemptContent)
    }
  }
}