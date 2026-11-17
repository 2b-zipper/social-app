const {withAppBuildGradle} = require('expo/config-plugins')

const storeFileProperty = 'BSKY_UPLOAD_STORE_FILE'

const debugSigningConfig = /( *)signingConfigs \{(\r?\n)\s*debug \{[^}]*\}/

const releaseBuildTypeSigning =
  /(release \{(\r?\n))(?:[ \t]*\/\/[^\n]*\n)*([ \t]*)signingConfig signingConfigs\.debug/

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, config => {
    let contents = config.modResults.contents
    if (contents.includes(storeFileProperty)) {
      return config
    }

    if (!debugSigningConfig.test(contents)) {
      throw Error(
        'Expected to find the debug signingConfig in android/app/build.gradle. ' +
          'Check whether the Expo template changed.',
      )
    }
    if (!releaseBuildTypeSigning.test(contents)) {
      throw Error(
        'Expected the release buildType to sign with signingConfigs.debug in ' +
          'android/app/build.gradle. Check whether the Expo template changed.',
      )
    }

    contents = contents.replace(debugSigningConfig, (match, indent, eol) => {
      const i = `${indent}    `
      return [
        match,
        `${i}release {`,
        `${i}    if (project.hasProperty('${storeFileProperty}')) {`,
        `${i}        storeFile file(${storeFileProperty})`,
        `${i}        storePassword BSKY_UPLOAD_STORE_PASSWORD`,
        `${i}        keyAlias BSKY_UPLOAD_KEY_ALIAS`,
        `${i}        keyPassword BSKY_UPLOAD_KEY_PASSWORD`,
        `${i}    }`,
        `${i}}`,
      ].join(eol)
    })
    contents = contents.replace(
      releaseBuildTypeSigning,
      (_match, release, eol, indent) =>
        [
          `${release}${indent}signingConfig project.hasProperty('${storeFileProperty}')`,
          `${indent}    ? signingConfigs.release`,
          `${indent}    : signingConfigs.debug`,
        ].join(eol),
    )

    config.modResults.contents = contents
    return config
  })
}
