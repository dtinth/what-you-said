import { spawn } from "child_process";
import { createInterface } from "readline";
import { Readable } from "stream";
import { readFileSync } from "node:fs";

const secret = readFileSync(".data/secret.txt", "utf8").trim();

function microphoneSource() {
  return Readable.from(
    (async function* () {
      const process = spawn(
        "rec",
        [
          // rec -b 16 -c 1 -t raw -e signed-integer - rate 16000
          "-b",
          "16",
          "-c",
          "1",
          "-t",
          "raw",
          "-e",
          "signed-integer",
          "-r",
          "16000",
          "-",
        ],
        { stdio: ["ignore", "pipe", "inherit"] }
      );
      yield* process.stdout;
    })(),
    { objectMode: false }
  );
}

function transcriber(input) {
  const child = spawn("transcriber", [], {
    stdio: ["pipe", "pipe", "inherit"],
    env: { ...process.env, TRANSCRIBE_ON_DEVICE_ONLY: "1" },
  });
  input.pipe(child.stdin);
  return child.stdout;
}

const input = transcriber(microphoneSource());
for await (const line of createInterface({ input: input })) {
  if (line.trim()) {
    const body = JSON.parse(line);
    // console.log(line);
    console.log(body.text);
    await fetch("http://127.0.0.1:7826/transcription", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
    });
  }
}
