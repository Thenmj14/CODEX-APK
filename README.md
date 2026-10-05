1. PROJECT OVERVIEW

App Name: CODEX
Package ID: com.yagenrobotics.codex
Development Workspace: Antigravity 
GitHub Repository: https://github.com/Thenmj14/CODEX-APK
Platform: Android (ARM64/aarch64 devices only)

What CODEX Is:
CODEX is a fully offline, standalone Android app that lets someone build programs for robots and electronics using drag-and-drop visual blocks (like Scratch), instead of typing code by hand. Once the blocks are arranged, the app automatically converts them into real Arduino C++ code, compiles that code into a program the hardware can run, and uploads it directly to the connected device over USB — all without needing a PC, the internet, or any separate software installed on the tablet.

What It's Used For:
CODEX currently supports three pieces of hardware, all built and sold under Yagen Robotics:

Mark 1 — a robot built on an Arduino Uno (ATmega328P chip)
Mark 2 — a second robot, also Arduino Uno based
IoT LED Cube — a device built on an ESP32 chip (WiFi/Bluetooth capable microcontroller)

A user (such as a student) opens the app on an Android tablet, drags blocks together to build a program (e.g., "move forward," "blink LED," "show time on the cube"), connects the device by USB, and presses Upload. The entire process — translating blocks to code, compiling, and flashing the hardware — happens locally on the tablet itself.

2. WHY THIS APP EXISTS / THE CORE CHALLENGE

The original product was a Windows desktop app (an .exe), built with:

A React + Vite + Blockly frontend (the visual block editor)
A Python Flask backend running locally, which called arduino-cli (Arduino's official command-line compiler tool) to compile and upload code

The goal was to turn this into a single Android APK that works exactly the same way — fully offline, no separate server, no internet — so it could be used on tablets in a classroom/workshop setting without a laptop.

The central technical challenge: Android does not work like a normal Linux PC. Programs built for regular Linux computers (which is what arduino-cli's compilers are) cannot normally run on Android, because Android uses a different core system library. Solving this mismatch — and doing it twice, for two completely different chip families (AVR and ESP32) — was the majority of the engineering work in this project. Full details are in Section 6.

3. HIGH-LEVEL ARCHITECTURE

The app has four main layers:

A. Frontend (the UI the user sees and touches)

Built with React (JavaScript UI library) and Vite (build tool)
Uses Blockly (Google's open-source visual programming library) for the drag-and-drop block editor
Converts blocks into real Arduino C++ source code live, shown in a code preview panel
Wrapped into a native Android app shell using Capacitor (a framework that lets a web app run as a real installable Android app, showing the web UI inside a WebView with no visible browser chrome)

B. Native Android Backend (replaces the old Python Flask server)

Written in Java, living inside the Android project at:
android/app/src/main/java/com/yagenrobotics/codex/
Key files:
Toolchain.java — manages unpacking the bundled compiler files on first launch, and runs the actual compile step
ToolchainPlugin.java — the "bridge" that lets the JavaScript frontend call into this native Java code (a Capacitor Plugin)
AvrdudeUploader.java — uploads compiled programs to Arduino Uno boards (Mark1/Mark2)
EspUploader.java — uploads compiled programs to the ESP32 (IoT Cube)
SerialPort.java — handles the Serial Monitor (reading/writing live text data over USB while the device runs)
IntelHex.java, Stk500.java, UsbUploadHelper.java — supporting upload-protocol code

C. The Compiler Toolchain (bundled inside the app itself)
Two complete, separate offline compiler toolchains are bundled inside the APK as asset files:

pack.zip (~82 MB) — the AVR/Arduino Uno toolchain (arduino-cli, avr-gcc compiler, avrdude uploader, AVR core files)
esp32.zip (~234 MB) — the ESP32 toolchain (xtensa-esp32-elf-gcc compiler, esptool uploader, a full portable Python interpreter, ESP32 core/SDK files)

On first app launch, these zips are extracted into the app's private storage folder and prepared for use (see Section 6 for why this is complicated).

D. Hardware Connection (USB)
The tablet's connected hardware is found at /dev/ttyUSB0 — a special device file. This works because the specific tablet model used has a built-in kernel driver (ch341-uart) that automatically recognizes the USB-to-serial chip used on both the Arduino Uno and the ESP32 boards, and makes it available to any app without needing special permission dialogs.

4. TOOLS, FRAMEWORKS & TECHNOLOGIES USED

Development Tools:

Antigravity — AI-assisted coding workspace used to write and manage the project
Android Studio — official Google IDE, used to build/compile/sign the final APK
Visual Studio Code (and similar) — used for editing source files
Git / GitHub — version control and code hosting
PowerShell — Windows terminal, used for nearly all setup/debugging commands
ADB (Android Debug Bridge) — Google's tool for communicating with the Android tablet from a PC (installing apps, running commands, pulling/pushing files, viewing logs)
7-Zip — used to extract/create certain archive formats PowerShell's built-in tools couldn't handle correctly

Core Frameworks / Libraries:

React (v18) — frontend UI framework
Vite — frontend build tool/bundler
Blockly (v12) — Google's visual block-programming library
Capacitor — wraps the web frontend into a native Android app, and provides the plugin bridge between JavaScript and native Java code
arduino-cli — Arduino's official command-line build tool (handles translating sketches into compiler commands, used for both AVR and ESP32)

Compilers / Toolchains bundled inside the app:

avr-gcc (version 7.3.0) — compiles code for the Arduino Uno's AVR chip
xtensa-esp32-elf-gcc (version 14.2.0) — compiles code for the ESP32 chip
avrdude (version 8.0.0) — uploads compiled programs to AVR boards
esptool.py (version 4.8.1) — uploads compiled programs to ESP32 boards
Python 3.9 (portable, custom-built) — required to run esptool, since Android has no Python installed by default

System compatibility libraries (the "glibc bridge" — explained fully in Section 6):

ld-linux-aarch64.so.1 — the Linux program loader
libc.so.6, libm.so.6, libpthread.so.0, libdl.so.2, librt.so.1 — core C library pieces
libgcc_s.so.1, libstdc++.so.6 — C++ runtime support
libz.so.1 — compression library (needed by esptool)
libexpat.so.1 — XML parsing library (needed by Python)

All of these were sourced from Debian Linux's official package archive (deb.debian.org), matched to the ARM64 (aarch64) architecture and the correct glibc version.

5. HOW THE APP WORKS — STEP BY STEP WORKFLOW
User opens the app. On first-ever launch, the app silently unpacks the AVR toolchain (pack.zip) into its private storage and prepares it (this is the ensureReady() process in Toolchain.java).
User builds a program by dragging blocks together in the Blockly editor (choosing the board — Mark1, Mark2, or IoT Cube — from the toolbar).
Blocks are converted to Arduino C++ code live, shown in the Code panel.
User plugs in the device over USB. The app detects it at /dev/ttyUSB0.
User taps Upload. This triggers, in order:
If targeting the ESP32 for the first time, the much larger esp32.zip toolchain is unpacked (slower, one-time cost).
The native Java code runs arduino-cli compile, which internally calls the correct compiler (avr-gcc or xtensa-esp32-elf-gcc) for the chosen board.
The compiler produces a finished program file (.hex for AVR, .bin for ESP32).
The appropriate uploader (avrdude for AVR, esptool for ESP32) sends that file to the board over the USB serial connection.
Success/failure and a full log are shown in the Log panel.
Serial Monitor (optional): the user can open a live text console showing debug output the running device prints back over USB (e.g., sensor readings), and can also type text to send to the device.
6. MAJOR PROBLEMS FACED & HOW THEY WERE SOLVED (Detailed)

This section is the most important part of this document for anyone maintaining or extending the app later, because it explains why the code is structured the way it is.

Problem 1: Android can't run the same compiler files a Windows PC uses

The issue: arduino-cli downloads real compiler programs (avr-gcc, and later xtensa-esp32-elf-gcc) that are built to run on regular Linux computers. Regular Linux uses a core system library called glibc. Android, even though it's technically "Linux-based" underneath, does not use glibc — it uses a completely different, Android-specific library called Bionic. A program built expecting glibc fails to even start on Android, with a confusing error like "No such file or directory" — even though the file is clearly present — because the specific starter program (loader) it expects, /lib/ld-linux-aarch64.so.1, doesn't exist on Android at that path.

Why we didn't just "find an Android version": No one has published a ready-made, Android-native (Bionic-compatible) build of these specific AVR/ESP32 compilers. Building one from scratch would be a multi-week specialist compiler-engineering project.

The actual fix used — "bundle your own glibc": Instead of rebuilding the compiler, we downloaded the handful of small system library files it needs (the loader + a few .so library files) directly from Debian Linux's official package servers, matched to ARM64 and the correct glibc version. These files are bundled inside the app alongside the compiler itself.

How it's actually invoked — "wrapping": A compiled Linux program has its expected loader path permanently baked into the file itself (called the ELF interpreter). Since we can't edit every single compiler binary by hand, Toolchain.java has a function called wrapElfs() that:

Scans every file in the unpacked toolchain folder
Checks each one's raw bytes to detect if it's a 64-bit ARM Linux program that expects a loader (reading the ELF header directly)
If so, renames the real program to <name>.real
Writes a tiny replacement shell script in its place, with the same original name, that says: "run the bundled loader, tell it to use our bundled library files, and have it execute the real program"

This way, every program in the compiler toolchain gets automatically wrapped at install time, using the app's actual real install path on that specific device (never hardcoded), without needing to permanently edit any of the binary files themselves.

Problem 2: The compiler's "install path" changes on every device/install

Early in development, several configuration fixes were done by hand on one specific tablet, with the tablet's exact folder path typed directly into config files (e.g., /data/user/0/com.yagenrobotics.codex/files/toolchain/...). This is fragile — it would only work on that one install.

The fix: All such hardcoded paths in platform.txt (arduino-cli's board configuration file) were replaced with a placeholder token, @BASE@. Toolchain.java has a fillPlaceholders() function that does a simple find-and-replace of @BASE@ with the real install path, automatically, every time the app sets up the toolchain. This means the exact same bundled zip file works correctly no matter which device it's installed on.

Problem 3: arduino-cli's tool was designed to look things up online

arduino-cli normally finds its compilers and tools by checking an online index file (a list of download URLs) the first time it needs something. Since the app runs fully offline, several of these lookups came back empty, causing arduino-cli to fail with errors like "compiler path is empty" even though the compiler was sitting right there on disk.

The fix: The relevant lines in each board's platform.txt file (compiler.path, tools.esptool_py.path, tools.ctags.path, etc.) were directly hardcoded (using the @BASE@ placeholder system above) to point at exactly where we placed the files, bypassing arduino-cli's online lookup system entirely.

Problem 4: ESP32's upload tool (esptool) needs Python — and Android has none

Unlike AVR's uploader (avrdude, a standalone program), ESP32's official uploader, esptool, is a Python program. Android ships with zero Python installed.

The fix: A complete, minimal, portable copy of Python 3.9 was built from scratch specifically for this project:

Downloaded Python 3.9's core interpreter and standard library as Debian .deb packages (matching Android's ARM64 architecture)
Downloaded esptool and all its dependencies (cryptography, pyserial, bitstring, etc.) as pre-compiled Python "wheel" files, specifically requesting the manylinux + cp39 (Python 3.9) + aarch64 combination
Assembled all of this into a self-contained folder (pyroot) bundled inside the ESP32 toolchain zip
This portable Python also needed its own small glibc-bridge fixes (libz.so.1 for compression, libexpat.so.1 for XML parsing) using the same Debian-package technique as Problem 1
Problem 5: esptool's command-line spelling didn't match what arduino-cli expected

The specific esptool version we were able to get running (4.8.1) spells its command-line options with underscores (e.g., --flash_mode), while the platform.txt recipe arduino-cli ships with for ESP32 expects a newer esptool version that uses hyphens (--flash-mode). Several other small mismatches existed too (the merge_bin command's flag names, and /usr/bin/env bash not existing on Android at all).

The fix: platform.txt was directly edited (via automated find-and-replace commands) to convert every affected option from the newer spelling to the one our bundled esptool version actually understands, and to replace /usr/bin/env bash with /system/bin/sh (the shell that does exist on Android).

Problem 6: The compiled files needed were much bigger than expected, and some were wrong architecture entirely

Several rounds of trial and error were needed to identify and source the exact right supporting files — for example, an early attempt grabbed libgcc.a (a file meant for compiling code that runs ON the target chip) when what was actually needed was libgcc_s.so.1 (a file needed to run the compiler ON the tablet itself) — two very differently-purposed files that happen to have similar names.

General lesson for future debugging: when a "missing file" or "wrong format" error appears, always check which side the file is for — target-chip-side (AVR/ESP32 itself) vs. host-side (the tablet's own ARM64 processor, needed to run the compiler program at all).

Problem 7: Windows tools corrupting data during file transfers

Several times, large files pulled from the tablet came back corrupted or in an unreadable format:

PowerShell's > redirect operator corrupts binary data when capturing a program's raw output — it tries to treat the data as text. Fix: route the same command through cmd /c "... > file" instead, which doesn't have this problem.
Windows' built-in tar.exe cannot read Android/GNU tar's extended-header format (used for long filenames). Fix: extract using 7-Zip instead, which handles this format correctly.
Symbolic links inside downloaded Linux archives sometimes extract as broken, empty (0-byte) files on Windows unless "Developer Mode" is enabled in Windows Settings.
Problem 8: Android blocks apps from running their own downloaded/unpacked programs

Starting with Android 10 (API level 29), Android enforces a security rule ("W^X" — a file can be writable, or executable, but not both at the same time, within an app's own private storage) that normally prevents an app from running any program it unpacked or downloaded itself.

The fix (and a critical thing to never change): the app's targetSdkVersion is deliberately set to 28 in android/variables.gradle. Apps targeting API 28 or lower are exempt from this restriction. This is the single most important configuration value in this entire project — see Section 8 for why.

Problem 9: USB connection to the hardware — why it "just works" here

Normal Android apps cannot open a raw serial device file like /dev/ttyUSB0 directly — they're expected to go through Android's formal USB Host API, which requires asking the user for USB permission via a popup, and requires a library like usb-serial-for-android to actually speak the serial protocol.

Why we didn't need any of that: the specific tablet model used for development has its own built-in Linux kernel driver for the USB-to-serial chip (a CH340/CH341 chip) used on both the Arduino Uno and the ESP32 boards. This driver automatically creates /dev/ttyUSB0 and makes it world-readable/writable the moment the device is plugged in — before any app even asks. This was discovered by checking adb logcat and seeing lines like ch341-uart converter now attached to ttyUSB0.

This is a device-specific convenience, not something guaranteed everywhere — see Section 7.

Problem 10: The Serial Monitor showed "Select a port" even with a port selected

Root cause (a simple bug, found after much investigation): the frontend's App.jsx was not actually passing the selected port down to the LogPanel component that contains the Serial Monitor — it was only being passed to the Toolbar. The dropdown displayed the right value, but the Serial Monitor component never received it as a prop.

The fix: added selectedPort={selectedPort} to the <LogPanel> element in App.jsx. Additionally, the Serial Monitor's actual connect/read/write logic was completely rewritten — it originally called http://127.0.0.1:5000/api/... (the old Windows Flask server address, which doesn't exist in the Android app at all) and had to be rewritten to call the new native Capacitor plugin methods instead (connectSerial, sendSerial, disconnectSerial, and a serialData event listener).

Problem 11: Uploading while the Serial Monitor was connected would conflict

Both the uploader and the Serial Monitor want exclusive access to the same USB port at the same time.

The fix: ToolchainPlugin.java's upload() method was changed to automatically close any active serial connection right before starting an upload, and notifies the web page (via a serialError event) that this happened, so the UI can update accordingly.

7. KNOWN LIMITATIONS & FUTURE RISKS — AND HOW TO HANDLE THEM

Risk 1 — This APK will only fully work on tablets with the same built-in USB-serial driver.
The upload/serial features depend entirely on the tablet having a built-in kernel driver that auto-creates /dev/ttyUSB0. Most ordinary phones and tablets do not have this.
→ If deploying to a different tablet model: First test if /dev/ttyUSB0 appears (adb shell ls -la /dev/ttyUSB0 with the board plugged in). If it doesn't, the app will need to be extended to use Android's standard USB Host API with the usb-serial-for-android library instead — this requires: adding a USB permission request popup, rewriting AvrdudeUploader.java/EspUploader.java/SerialPort.java to talk through that library's serial interface instead of a plain file path, and declaring USB device filters in the Android Manifest. This is a meaningful rewrite, not a small tweak.

Risk 2 — targetSdkVersion must never be raised above 28.
If any future Android library or requirement forces a bump to this value, the entire app breaks silently — compiling and uploading would simply stop working, because Android would once again block the app from executing its own bundled programs, with no obvious error pointing to the real cause. Keep a comment in the code and in team documentation permanently warning against this.

Risk 3 — Because of Risk 2, this app cannot be published to the Google Play Store.
Google Play requires apps to target a much newer Android API level than 28. Distribution must remain direct APK sharing (USB transfer, a cloud drive link, a GitHub Release, etc.), not the Play Store, unless the entire execution approach is redesigned (see Risk 1's fix, which removes the dependency that forces the low target level).

Risk 4 — The signing key is irreplaceable.
Every future update to this app must be signed with the exact same signing key (.jks/.keystore file) used for the first release build. If this file is lost, no future update can ever be installed over the existing app — users would have to fully uninstall and install a "new" app from scratch, losing all their saved projects. Back this key file up in at least two separate safe locations, outside the project folder, and never commit it to GitHub.

Risk 5 — esptool or arduino-cli option spellings may change again in future versions.
If the bundled esptool or arduino-cli version is ever upgraded, re-check every patched line in platform.txt against the new version's actual command-line help output (--help) before assuming it still works — this exact class of bug (hyphens vs. underscores) has already happened once.

Risk 6 — App size will only grow.
Currently around 320 MB installed, needing roughly 1.2 GB free device storage after first unpacking. Adding more board support (see Section 9) will increase this further. Consider, if this becomes a problem, trimming unused ESP32 chip variants more aggressively (the bundled toolchain still contains some unused chip-specific files) or exploring Android's "Play Asset Delivery"-style on-demand download patterns (though this reintroduces an internet dependency, which conflicts with the "fully offline" goal — weigh carefully).

8. HOW TO ADD SUPPORT FOR A NEW BOARD IN THE FUTURE

If Yagen Robotics creates a new product using a chip already supported (another AVR-based board, or another ESP32 variant):

Add the new board's entry to the existing boards.txt file for that chip family (already bundled).
Add a new block category/blocks in the frontend's src/blocks/ folder defining what code the new board's blocks should generate (following the existing pattern used for Mark1/Mark2/Cube blocks).
No new toolchain work is needed — the same compiler already handles it.

If Yagen Robotics creates a new product using a completely new chip family (e.g., a different brand of microcontroller):

Check if arduino-cli already supports it — most hobbyist boards do, via a board package you can install in a normal desktop Arduino IDE first, to confirm it works and see what it downloads.
Identify the exact compiler/uploader files that package downloads (same approach used in this project: check ~/.arduino15/packages/<vendor>/ on a PC with that board package installed).
Test whether that compiler is a glibc-linked Linux ARM64 binary (same test used throughout this project: push it to the tablet with adb push, try running it with adb shell, and see if it gives the "No such file or directory" error despite the file existing — that's the signature of the glibc problem).
If it is glibc-linked: repeat the exact same "bundle Debian's glibc files + wrapElfs()" process documented in Section 6, Problem 1. The wrapElfs() function in Toolchain.java is already generic and should work without modification — you likely only need to point it at the new toolchain's folder.
If the new chip's uploader also needs Python (like ESP32's esptool does): the portable Python build process in Section 6, Problem 4 can be reused — you'd need to pip download whatever new Python package that uploader requires instead of esptool.
Patch the new platform.txt the same way: convert hardcoded paths to @BASE@ placeholders, check for any /usr/bin/env or other Linux-assumption lines that need swapping for Android equivalents, and verify every command-line option spelling matches the exact bundled tool version.
Package the new toolchain as a new zip (e.g., newchip.zip) in android/app/src/main/assets/, and add a matching ensureNewChipReady() function in Toolchain.java, following the exact pattern of the existing ensureEsp32Ready() function.
Write a new uploader class (following AvrdudeUploader.java/EspUploader.java as templates) if the new chip uses a different upload protocol/tool.
9. IMPORTANT TERMINAL COMMANDS REFERENCE

Checking connected devices / basic ADB:

adb devices
adb shell
adb logcat -d | Select-String -Pattern "SOMETHING"

Checking the USB-serial device:

adb shell ls -la /dev/ttyUSB0
adb shell stty -F /dev/ttyUSB0 -a

Installing/uninstalling the app:

adb uninstall com.yagenrobotics.codex
adb install path\to\app-release.apk
adb shell pm clear com.yagenrobotics.codex

Viewing/pulling files from inside the app's private storage (needs run-as):

adb shell run-as com.yagenrobotics.codex ls files/toolchain
adb shell run-as com.yagenrobotics.codex cat files/toolchain/somefile > localfile.txt

Pulling large/binary files correctly (avoids PowerShell corruption):

cmd /c ""C:\path\to\adb.exe" exec-out run-as com.yagenrobotics.codex tar -cf - -C files/toolchain SOMEFOLDER > output.tar"

Building the web frontend:

npm run build
npx cap sync android

Git — checking status, staging, committing, pushing:

git status --short
git add .
git commit -m "message here"
git push

Git — removing an already-tracked large file (keeps it on disk, stops tracking):

git rm --cached path\to\largefile.zip

Downloading a Debian package and extracting it (for future glibc-bridge work):

curl.exe -L -o package.deb "http://deb.debian.org/debian/pool/main/..."
tar -xf package.deb -C extracted_folder    (or use 7-Zip if Windows tar fails)
tar -xf extracted_folder\data.tar.xz -C final_folder
10. THINGS TO KEEP IN MIND FOR FUTURE UPDATES
Never raise targetSdkVersion above 28 without fully re-architecting the USB/execution approach first.
Always test a freshly-installed copy of the app (not just one already running with leftover manually-pushed files) before considering any fix "done" — several bugs in this project only appeared because old manual test data masked the real issue.
Keep the signing key backed up in multiple safe places outside the project folder, and never commit it to Git.
Never commit pack.zip, esp32.zip, or built .apk/.aab files to GitHub — they exceed or approach GitHub's size limits. Distribute these via GitHub Releases (which allow up to 2 GB per file) instead, and document in the repo's README where to get them before building.
Test any new tablet model for the /dev/ttyUSB0 auto-driver behavior before assuming upload/serial will work out of the box.
When debugging a "file not found" or "cannot execute" error on anything in the toolchain, check first whether it's a glibc-loader problem (the classic signature: the file visibly exists via ls, but still fails to run) before assuming something is actually missing.
Document every platform.txt patch you make with a comment explaining why, since future tool version upgrades may silently undo or conflict with these fixes.
Re-verify command-line option spelling whenever bundling a new or updated version of any CLI tool (esptool, arduino-cli, avrdude) — exact spelling mismatches have already caused real bugs in this project.
