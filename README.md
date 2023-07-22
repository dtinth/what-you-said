# What you said

A duct-taped Raycast extension that uses [dtinth/transcribe](https://github.com/dtinth/transcribe) to convert speech to text in the background and show a UI that lets me copy the text or paste it into the frontmost application.

![Screenshot](screenshot.png)

## How it works

The solution consists of several tools that are duct taped together

![image](https://github.com/dtinth/what-you-said/assets/193136/ad54b57d-89da-46ea-bae8-ff4fffb6e7b8)

- [SoX](https://sox.sourceforge.net/) is used to receive microphone input, and encode as PCM data
- [dtinth/transcribe](https://github.com/dtinth/transcribe) is used to perform speech recognition using Apple’s [SFSpeechRecognizer](https://developer.apple.com/documentation/speech/sfspeechrecognizer) API
- `scripts/writer.mjs` sends the speech recognition result to the server
- `scripts/server.mjs` receives the speech recognition result and forwards it to the Raycast extension
- The Raycast extension talks to the server to poll for the latest speech recognition result and renders a UI
- Raycast take care of launching the extension and actually performing the actions, such as copy to clipboard and paste into the frontmost window

## Usage

**Prerequisites:** Node.js, [Raycast](https://www.raycast.com/), [pnpm](https://pnpm.io/), [SoX](https://formulae.brew.sh/formula/sox), Xcode (to compile transcribe from source), [transcribe](https://github.com/dtinth/transcribe)

Again, this project is duct-taped, and you will need to run several terminal tabs in the background. You will also need to clone this project into this specific path because the path is hardcoded: `~/Raycast/Extensions/what-you-said`

1. Install dependencies.

   ```sh
   pnpm install
   ```

2. Run the server.

   ```sh
   node scripts/server.mjs
   ```

3. Run the transcriber.

   ```sh
   ./scripts/listen.sh
   ```

4. Run the Raycast extension.

   ```sh
   pnpm dev
   ```
