@echo off
setlocal enabledelayedexpansion

set "REQUIRED_JDK=17"
set "REQUIRED_NODE=24"

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_ROOT=%%~fI"
set "ANDROID_DIR=%REPO_ROOT%\android"

set "VARIANT=release"
set "TASK=assembleRelease"
set "DO_CLEAN=0"
set "SKIP_INTL=0"
set "SKIP_CHECKS=0"
set "JDK_HOME="
set "ABI_ARG=-PreactNativeArchitectures=arm64-v8a"
set "EXTRA_ARGS="

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="release" (
  set "VARIANT=release"
  set "TASK=assembleRelease"
) else if /i "%~1"=="debug" (
  set "VARIANT=debug"
  set "TASK=assembleDebug"
) else if /i "%~1"=="clean" (
  set "DO_CLEAN=1"
) else if /i "%~1"=="--all-abis" (
  set "ABI_ARG="
) else if /i "%~1"=="--jdk" (
  set "JDK_HOME=%~2"
  shift
) else if /i "%~1"=="--skip-intl" (
  set "SKIP_INTL=1"
) else if /i "%~1"=="--skip-checks" (
  set "SKIP_CHECKS=1"
) else if /i "%~1"=="--help" (
  goto usage
) else if /i "%~1"=="-h" (
  goto usage
) else (
  set "EXTRA_ARGS=!EXTRA_ARGS! %~1"
)
shift
goto parse_args
:args_done

set "APK_DIR=%ANDROID_DIR%\app\build\outputs\apk\%VARIANT%"
set "RAW_APK=%APK_DIR%\app-%VARIANT%.apk"

if not exist "%ANDROID_DIR%\gradlew.bat" (
  echo Error: %ANDROID_DIR%\gradlew.bat not found.
  echo Run "pnpm prebuild" first to generate the native android project.
  goto fail
)

if defined JDK_HOME (
  call :jdk_major "%JDK_HOME%"
  if not "!JDK_MAJOR!"=="%REQUIRED_JDK%" (
    echo Warning: --jdk "%JDK_HOME%" reports version !JDK_MAJOR!, expected %REQUIRED_JDK%.
  )
) else (
  if defined JAVA_HOME (
    call :jdk_major "%JAVA_HOME%"
    if "!JDK_MAJOR!"=="%REQUIRED_JDK%" set "JDK_HOME=%JAVA_HOME%"
  )
)

if not defined JDK_HOME (
  for %%R in (
    "C:\Program Files\Eclipse Adoptium"
    "C:\Program Files\Microsoft"
    "C:\Program Files\Java"
    "%LOCALAPPDATA%\Programs\Eclipse Adoptium"
  ) do (
    if not defined JDK_HOME (
      for /d %%D in ("%%~R\*jdk*%REQUIRED_JDK%*") do (
        if not defined JDK_HOME (
          call :jdk_major "%%~fD"
          if "!JDK_MAJOR!"=="%REQUIRED_JDK%" set "JDK_HOME=%%~fD"
        )
      )
    )
  )
)

if not defined JDK_HOME (
  call :jdk_major "C:\Program Files\Android\Android Studio\jbr"
  if "!JDK_MAJOR!"=="%REQUIRED_JDK%" set "JDK_HOME=C:\Program Files\Android\Android Studio\jbr"
)

if defined JDK_HOME (
  set "JAVA_HOME=!JDK_HOME!"
) else (
  echo Warning: no JDK %REQUIRED_JDK% found, falling back to JAVA_HOME=%JAVA_HOME%.
  echo          Expect "Inconsistent JVM-target compatibility" if it is not %REQUIRED_JDK%.
  echo          Point the script at one with --jdk "C:\path\to\jdk-%REQUIRED_JDK%".
)

if not defined JAVA_HOME (
  echo Error: no JDK found. Install JDK %REQUIRED_JDK% or pass --jdk "C:\path\to\jdk".
  goto fail
)

set "NODE_MAJOR="
for /f "tokens=*" %%I in ('node -v 2^>nul') do set "NODE_VER=%%I"
if defined NODE_VER (
  set "NODE_MAJOR=!NODE_VER:v=!"
  for /f "tokens=1 delims=." %%A in ("!NODE_MAJOR!") do set "NODE_MAJOR=%%A"
)
if "%SKIP_CHECKS%"=="0" (
  if not defined NODE_MAJOR (
    echo Error: node not found on PATH. Install node %REQUIRED_NODE% or newer.
    goto fail
  )
  if !NODE_MAJOR! LSS %REQUIRED_NODE% (
    if !NODE_MAJOR! GEQ 22 (
      echo Warning: node !NODE_VER! is older than the node %REQUIRED_NODE% this repo expects
      echo          ^(see "engines" in package.json^). Enabling
      echo          --experimental-strip-types so metro.config.ts still loads.
      echo.
      if defined NODE_OPTIONS (
        set "NODE_OPTIONS=!NODE_OPTIONS! --experimental-strip-types"
      ) else (
        set "NODE_OPTIONS=--experimental-strip-types"
      )
    ) else (
      echo Error: node !NODE_VER! is too old. This repo needs node %REQUIRED_NODE% or newer
      echo        ^(see "engines" in package.json^); older versions cannot load
      echo        metro.config.ts and the JS bundle step fails.
      echo        Pass --skip-checks to try anyway.
      goto fail
    )
  )
)

set "SIGN_STORE="
if /i "%VARIANT%"=="release" (
  if defined BSKY_UPLOAD_STORE_FILE (
    set "SIGN_STORE=%BSKY_UPLOAD_STORE_FILE%"
    set "ORG_GRADLE_PROJECT_BSKY_UPLOAD_STORE_FILE=%BSKY_UPLOAD_STORE_FILE%"
    set "ORG_GRADLE_PROJECT_BSKY_UPLOAD_STORE_PASSWORD=%BSKY_UPLOAD_STORE_PASSWORD%"
    set "ORG_GRADLE_PROJECT_BSKY_UPLOAD_KEY_ALIAS=%BSKY_UPLOAD_KEY_ALIAS%"
    set "ORG_GRADLE_PROJECT_BSKY_UPLOAD_KEY_PASSWORD=%BSKY_UPLOAD_KEY_PASSWORD%"
  ) else if exist "%USERPROFILE%\.gradle\gradle.properties" (
    for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%USERPROFILE%\.gradle\gradle.properties") do (
      if /i "%%A"=="BSKY_UPLOAD_STORE_FILE" set "SIGN_STORE=%%B"
    )
  )
)

echo Building Android %VARIANT% APK...
echo   repo:    %REPO_ROOT%

set "BRANCH="
set "COMMIT="
for /f "delims=" %%I in ('git -C "%REPO_ROOT%" rev-parse --abbrev-ref HEAD 2^>nul') do set "BRANCH=%%I"
for /f "delims=" %%I in ('git -C "%REPO_ROOT%" rev-parse --short^=6 HEAD 2^>nul') do set "COMMIT=%%I"
if defined BRANCH echo   branch:  %BRANCH%
if defined COMMIT echo   commit:  %COMMIT%
echo   jdk:     %JAVA_HOME%
if defined NODE_VER echo   node:    %NODE_VER%
if defined ABI_ARG (echo   abis:    arm64-v8a) else (echo   abis:    all)
if /i "%VARIANT%"=="release" (
  if defined SIGN_STORE (
    echo   signing: !SIGN_STORE!
  ) else (
    echo   signing: debug keystore ^(no BSKY_UPLOAD_STORE_FILE configured^)
  )
)
echo.

if /i "%VARIANT%"=="debug" (
  echo Note: a debug APK does not embed the JS bundle. Start Metro with
  echo       "pnpm start" and keep it reachable, or the app will fail to load.
  echo.
)

if "%SKIP_INTL%"=="0" (
  where pnpm >nul 2>nul
  if errorlevel 1 (
    echo Warning: pnpm not found on PATH, skipping "pnpm intl:compile".
  ) else (
    echo Compiling translations...
    pushd "%REPO_ROOT%"
    call pnpm intl:compile
    set "INTL_RESULT=!ERRORLEVEL!"
    popd
    if not "!INTL_RESULT!"=="0" (
      if exist "%REPO_ROOT%\src\locale\locales\en\messages.ts" (
        echo Warning: pnpm intl:compile failed, falling back to the already
        echo          compiled translations in src\locale\locales.
      ) else (
        echo Error: pnpm intl:compile failed and there are no compiled
        echo        translations to fall back to.
        goto fail
      )
    )
  )
  echo.
)

if exist "%RAW_APK%" del /q "%RAW_APK%"

pushd "%ANDROID_DIR%"

if "%DO_CLEAN%"=="1" (
  echo Running gradle clean...
  call "%ANDROID_DIR%\gradlew.bat" clean
  set "CLEAN_RESULT=!ERRORLEVEL!"
  if not "!CLEAN_RESULT!"=="0" (
    popd
    echo Error: gradle clean failed.
    goto fail
  )
)

echo Running gradlew %TASK%...
call "%ANDROID_DIR%\gradlew.bat" %TASK% %ABI_ARG%%EXTRA_ARGS%
set "BUILD_RESULT=!ERRORLEVEL!"
popd

if not "%BUILD_RESULT%"=="0" (
  echo.
  echo Error: gradle build failed with exit code %BUILD_RESULT%.
  goto fail
)

if not exist "%RAW_APK%" (
  echo.
  echo Error: expected APK not found at %RAW_APK%
  goto fail
)

set "OUT_APK=%RAW_APK%"
if defined COMMIT (
  set "SAFE_BRANCH=%BRANCH:/=-%"
  set "SAFE_BRANCH=!SAFE_BRANCH:\=-!"
  set "SAFE_BRANCH=!SAFE_BRANCH: =-!"
  set "OUT_APK=%APK_DIR%\bsky-app-%VARIANT%-!SAFE_BRANCH!-%COMMIT%.apk"
  move /y "%RAW_APK%" "!OUT_APK!" >nul
  if errorlevel 1 (
    echo Warning: could not rename the APK, leaving it as app-%VARIANT%.apk.
    set "OUT_APK=%RAW_APK%"
  )
)

echo.
echo Build succeeded.
echo   !OUT_APK!
echo.
echo Install it with:
echo   adb install -r "!OUT_APK!"
set "EXIT_CODE=0"
goto end

:jdk_major
set "JDK_MAJOR="
if not exist "%~1\release" goto :eof
for /f "usebackq tokens=1,* delims==" %%A in ("%~1\release") do (
  if "%%A"=="JAVA_VERSION" (
    for /f "tokens=1 delims=." %%C in ("%%~B") do set "JDK_MAJOR=%%C"
  )
)
goto :eof

:usage
echo Usage: scripts\buildAndroidApk.bat [release^|debug] [clean] [options] [gradle args]
echo.
echo   release        Build a release APK (default).
echo   debug          Build a debug APK. Needs a running Metro server at runtime.
echo   clean          Run "gradlew clean" before building.
echo   --all-abis     Build every ABI instead of arm64-v8a only (much slower).
echo   --jdk ^<path^>   Build with this JDK instead of the auto-detected one.
echo   --skip-intl    Skip "pnpm intl:compile".
echo   --skip-checks  Skip the node version check.
echo.
echo Any other argument is passed through to gradlew, e.g. --no-daemon.
set "EXIT_CODE=0"
goto end

:fail
set "EXIT_CODE=1"

:end
set "CMD_LINE=%cmdcmdline%"
if not "!CMD_LINE!"=="!CMD_LINE:%~nx0=!" (
  echo.
  pause
)
exit /b %EXIT_CODE%
