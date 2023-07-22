# What you said

A duct-taped Raycast extension that uses [dtinth/transcribe](https://github.com/dtinth/transcribe) to convert speech to text in the background and show a UI that lets me copy the text or paste it into the frontmost application.

![Screenshot](screenshot.png)

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
