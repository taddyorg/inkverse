const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const config = getSentryExpoConfig(__dirname);

// Add resolver for TypeScript modules
config.resolver = {
  ...config.resolver,
  // Add a custom resolver to handle .js imports pointing to .ts files
  resolveRequest: (context, moduleName, platform) => {
    // First try the default resolution
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (error) {
      // If the default resolution fails, and the extension is .js
      if (moduleName.endsWith('.js')) {
        // Try resolving with .ts instead
        const tsModuleName = moduleName.replace(/\.js$/, '.ts');
        try {
          return context.resolveRequest(context, tsModuleName, platform);
        } catch (tsError) {
          // If that also fails, throw the original error
          throw error;
        }
      }
      throw error;
    }
  }
};

module.exports = config; 