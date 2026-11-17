const {withAppBuildGradle} = require('expo/config-plugins')

const cmakeVersion = '3.31.6'

const ndkVersionLine = /^( *)ndkVersion rootProject\.ext\.ndkVersion(\r?\n)/m

module.exports = function withAndroidCMakeVersion(config) {
  if (process.platform !== 'win32') {
    return config
  }
  return withAppBuildGradle(config, config => {
    const contents = config.modResults.contents
    if (contents.includes(`version '${cmakeVersion}'`)) {
      return config
    }
    if (!ndkVersionLine.test(contents)) {
      throw Error(
        'Expected to find ndkVersion in android/app/build.gradle. ' +
          'Check whether the Expo template changed.',
      )
    }
    config.modResults.contents = contents.replace(
      ndkVersionLine,
      (match, indent, eol) =>
        match +
        [
          '',
          `${indent}externalNativeBuild {`,
          `${indent}    cmake {`,
          `${indent}        version '${cmakeVersion}'`,
          `${indent}    }`,
          `${indent}}`,
          '',
        ].join(eol),
    )
    return config
  })
}
