import {Provider as AltTextRequiredProvider} from './alt-text-required'
import {Provider as AutoplayProvider} from './autoplay'
import {Provider as BypassBlocksProvider} from './bypass-blocks'
import {Provider as DisableHapticsProvider} from './disable-haptics'
import {Provider as ExternalEmbedsProvider} from './external-embeds-prefs'
import {Provider as HiddenPostsProvider} from './hidden-posts'
import {Provider as InAppBrowserProvider} from './in-app-browser'
import {Provider as KawaiiProvider} from './kawaii'
import {Provider as LanguagesProvider} from './languages'
import {Provider as LargeAltBadgeProvider} from './large-alt-badge'
import {Provider as MaterialYouProvider} from './material-you'
import {Provider as PreferGoogleTranslateProvider} from './prefer-google-translate'
import {Provider as SubtitlesProvider} from './subtitles'
import {Provider as TrendingSettingsProvider} from './trending'
import {Provider as UsedStarterPacksProvider} from './used-starter-packs'

export {
  useRequireAltTextEnabled,
  useSetRequireAltTextEnabled,
} from './alt-text-required'
export {useAutoplayDisabled, useSetAutoplayDisabled} from './autoplay'
export {useBypassBlocks, useSetBypassBlocks} from './bypass-blocks'
export {useHapticsDisabled, useSetHapticsDisabled} from './disable-haptics'
export {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from './external-embeds-prefs'
export {useHiddenPosts, useHiddenPostsApi} from './hidden-posts'
export {useLabelDefinitions} from './label-defs'
export {useLanguagePrefs, useLanguagePrefsApi} from './languages'
export {useMaterialYou, useSetMaterialYou} from './material-you'
export {
  usePreferGoogleTranslate,
  useSetPreferGoogleTranslate,
} from './prefer-google-translate'
export {useSetSubtitlesEnabled, useSubtitlesEnabled} from './subtitles'

export function Provider({children}: React.PropsWithChildren<{}>) {
  return (
    <LanguagesProvider>
      <AltTextRequiredProvider>
        <LargeAltBadgeProvider>
          <ExternalEmbedsProvider>
            <HiddenPostsProvider>
              <InAppBrowserProvider>
                <DisableHapticsProvider>
                  <AutoplayProvider>
                    <UsedStarterPacksProvider>
                      <SubtitlesProvider>
                        <TrendingSettingsProvider>
                          <KawaiiProvider>
                            <PreferGoogleTranslateProvider>
                              <BypassBlocksProvider>
                                <MaterialYouProvider>
                                  {children}
                                </MaterialYouProvider>
                              </BypassBlocksProvider>
                            </PreferGoogleTranslateProvider>
                          </KawaiiProvider>
                        </TrendingSettingsProvider>
                      </SubtitlesProvider>
                    </UsedStarterPacksProvider>
                  </AutoplayProvider>
                </DisableHapticsProvider>
              </InAppBrowserProvider>
            </HiddenPostsProvider>
          </ExternalEmbedsProvider>
        </LargeAltBadgeProvider>
      </AltTextRequiredProvider>
    </LanguagesProvider>
  )
}
