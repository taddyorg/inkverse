import type { MetaFunction } from "react-router";
import { getMetaTags } from "@/lib/seo";

export const meta: MetaFunction = () => {
  return getMetaTags(
    "Download the Inkverse Mobile App",
    "Discover and read the best webtoons and webcomics on Inkverse - your premier mobile app for digital comics. Available on iOS and Android.",
    "https://inkverse.co/download-app"
  );
}

export default function DownloadApp() {
  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mt-4 mb-8 text-4xl font-extrabold tracking-tight sm:text-6xl">
            <span className="block">Download the Inkverse Mobile App</span>
          </h1>
          
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* App Store Buttons */}
              <div className="space-y-6">
                <a href="https://inkverse.co/ios" target="_blank" rel="noopener noreferrer" 
                   className="block transition-transform hover:scale-105">
                  <img className="h-16 mx-auto" src="https://ax0.taddy.org/general/apple-app-store-badge.png" alt="Download on the App Store" />
                </a>
                <a href="https://inkverse.co/android" target="_blank" rel="noopener noreferrer"
                   className="block transition-transform hover:scale-105">
                  <img className="h-16 mx-auto" src="https://ax0.taddy.org/general/google-play-badge.png" alt="Get it on Google Play" />
                </a>
                {/* <p className="hidden md:block mt-4 text-sm">Available on iOS and Android</p> */}
              </div>
              
              {/* QR Code */}
              <div className="hidden md:block">
                <img className="w-48 h-48 mx-auto dark:hidden" src="https://ink0.inkverse.co/general/qr-code-4.png" alt="Scan QR Code to Download" />
                <img className="w-48 h-48 mx-auto hidden dark:block" src="https://ink0.inkverse.co/general/qr-code-5.png" alt="Scan QR Code to Download" />
                <p className="mt-4 text-sm">Or scan the QR code to download the app</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}