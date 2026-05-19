const { withAndroidManifest, withStringsXml } = require('@expo/config-plugins');

const withAppBlockerPermissions = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Add SYSTEM_ALERT_WINDOW permission if not already present
    let permissions = manifest.manifest['uses-permission'] || [];
    const hasPermission = permissions.some(
      (perm) => perm.$['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW'
    );

    if (!hasPermission) {
      permissions.push({
        $: {
          'android:name': 'android.permission.SYSTEM_ALERT_WINDOW',
        },
      });
    }

    manifest.manifest['uses-permission'] = permissions;

    // Add Accessibility Service declaration if not already present
    let application = manifest.manifest.application || [];
    if (!Array.isArray(application)) {
      application = [application];
    }

    // Check if AccessibilityService already exists
    let hasService = false;
    let hasActivity = false;

    application.forEach((appNode) => {
      if (appNode.service) {
        const services = Array.isArray(appNode.service) ? appNode.service : [appNode.service];
        hasService = services.some(
          (service) => service.$?.['android:name'] === 'expo.modules.appblocker.AppBlockerAccessibilityService'
        );
      }
      if (appNode.activity) {
        const activities = Array.isArray(appNode.activity) ? appNode.activity : [appNode.activity];
        hasActivity = activities.some(
          (activity) => activity.$?.['android:name'] === 'expo.modules.appblocker.BlockOverlayActivity'
        );
      }
    });

    if (!hasService || !hasActivity) {
      const appEntry = application[0] || {};

      if (!appEntry.service) {
        appEntry.service = [];
      }
      if (!Array.isArray(appEntry.service)) {
        appEntry.service = [appEntry.service];
      }

      if (!appEntry.activity) {
        appEntry.activity = [];
      }
      if (!Array.isArray(appEntry.activity)) {
        appEntry.activity = [appEntry.activity];
      }

      // Add Accessibility Service if not already present
      if (!hasService) {
        appEntry.service.push({
          $: {
            'android:name': 'expo.modules.appblocker.AppBlockerAccessibilityService',
            'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
            'android:exported': 'false',
          },
          'intent-filter': {
            action: {
              $: {
                'android:name': 'android.accessibilityservice.AccessibilityService',
              },
            },
          },
          'meta-data': {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/app_blocker_service_config',
            },
          },
        });
      }

      // Add BlockOverlayActivity if not already present
      if (!hasActivity) {
        appEntry.activity.push({
          $: {
            'android:name': 'expo.modules.appblocker.BlockOverlayActivity',
            'android:theme': '@android:style/Theme.Translucent.NoTitleBar',
            'android:exported': 'true',
            'android:excludeFromRecents': 'true',
            'android:taskAffinity': '',
            'android:noHistory': 'true',
            'android:launchMode': 'singleTask',
          },
        });
      }

      manifest.manifest.application = application;
    }

    return config;
  });
};

const withAppBlockerStrings = (config) => {
  return withStringsXml(config, (config) => {
    const stringsXml = config.modResults;

    // Add accessibility service description string
    const resources = stringsXml.resources;
    const strings = Array.isArray(resources.string) ? resources.string : resources.string ? [resources.string] : [];

    // Check if string already exists
    const hasString = strings.some(
      (str) => str && str.$ && str.$.name === 'accessibility_service_description'
    );

    if (!hasString) {
      strings.push({
        $: {
          name: 'accessibility_service_description',
        },
        _text: 'Detox Duel uses this service to detect when you open banned apps during a duel and shows a blocking screen to help you stay focused.',
      });

      if (Array.isArray(resources.string)) {
        resources.string = strings;
      } else {
        stringsXml.resources = {
          ...resources,
          string: strings
        };
      }
    }

    return config;
  });
};

module.exports = (config) => {
  config = withAppBlockerPermissions(config);
  // config = withAppBlockerStrings(config); // Temporarily disabled due to XML builder issues
  return config;
};