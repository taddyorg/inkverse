const isProductionBuild = process.env.EAS_BUILD_PROFILE === "production";

export default {
  expo: {
    name: "Inkverse",
    slug: "inkverse",
    version: "3.5",
    orientation: "portrait",
    icon: "./assets/icons/ios-light.png",
    scheme: "inkverse",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    jsEngine: "hermes",
    ios: {
      bundleIdentifier: "art.bamcomics.taddy",
      buildNumber: "1",
      supportsTablet: false,
      infoPlist: {
        LSApplicationQueriesSchemes: [
          "https",
          "mailto",
          "itms-apps"
        ],
        ITSAppUsesNonExemptEncryption: false,
        // Allow plain HTTP to the local dev server (config.ts uses http://inkverse.test:3010 in __DEV__)
        ...(isProductionBuild ? {} : {
          NSAppTransportSecurity: {
            NSAllowsArbitraryLoads: false,
            NSAllowsLocalNetworking: true,
            NSExceptionDomains: {
              "inkverse.test": {
                NSExceptionAllowsInsecureHTTPLoads: true
              }
            }
          }
        })
      },
      associatedDomains: [
        "applinks:inkverse.co"
      ],
      appleTeamId: "4AF4P2U4ZF",
      usesAppleSignIn: true
    },
    android: {
      package: "com.bamtoons",
      versionCode: 106,
      minSdkVersion: 35,
      adaptiveIcon: {
        foregroundImage: "./assets/icons/adaptive-icon.png",
        backgroundColor: "#FFE9E4"
      },
      permissions: [
        "android.permission.INTERNET"
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES ?? "./google-services.json",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "inkverse.co"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    plugins: [
      "@bacons/apple-targets",
      [
        "expo-build-properties",
        {
          ios: {
            // Required to build with Xcode 27 / iOS 27 SDK on SDK 57. Remove after upgrading to SDK 58.
            enableSceneSupport: true
          }
        }
      ],
      "expo-status-bar",
      [
        "expo-navigation-bar",
        {
          // Keep navigation bar visible but fully transparent (no contrast scrim behind 3-button nav)
          enforceContrast: false
        }
      ],
      [
        "expo-splash-screen",
        {
          backgroundColor: "#FFE9E4",
          image: "./assets/images/inkverse-logo.png",
          imageWidth: 200
        }
      ],
      "expo-localization",
      [
        "expo-font",
        {
          fonts: [
            "assets/fonts/SourceSans3-Regular.ttf",
            "assets/fonts/SourceSans3-SemiBold.ttf",
            "assets/fonts/SourceSans3-Bold.ttf"
          ]
        }
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: "com.googleusercontent.apps.485860487313-mecvs6na5ih575klndmmiu3li1ikjiod"
        }
      ],
      "expo-apple-authentication",
      [
        "expo-notifications",
        {
          icon: "./assets/icons/android-push.png"
        }
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true
        }
      ],
      [
        "expo-image"
      ]
    ],
    extra: {
      eas: {
        projectId: "149ba335-e117-4b21-8359-41b61b059885"
      }
    }
  }
};
