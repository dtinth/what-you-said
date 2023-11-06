import { spawn } from "child_process";
import { createInterface } from "readline";
import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Duplex } from "stream";
import { parentPort } from "worker_threads";

function isAbortError(e) {
  return e.name === "AbortError";
}

async function* microphone(signal) {
  const child = spawn("rec", ["-b", "16", "-c", "1", "-t", "raw", "-e", "signed-integer", "-", "rate", "16000"], {
    stdio: ["ignore", "pipe", "pipe"],
    signal,
  });
  child.on("error", (error) => {
    if (isAbortError(error)) return;
    console.error("Microphone process encountered error", error);
  });
  printLinePrefix(`microphone`, child.stderr);
  yield* child.stdout;
}

function printLinePrefix(prefix, stream) {
  (async () => {
    try {
      for await (const line of createInterface({ input: stream })) {
        console.log(`[${prefix}]`, line);
      }
    } catch (error) {
      if (isAbortError(error)) return;
      console.error(`[${prefix}]`, error);
    }
  })();
}

function createTranscriber(language, requireOnDevice, signal) {
  const child = spawn("transcriber", [language], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...(requireOnDevice ? { TRANSCRIBE_ON_DEVICE_ONLY: "1" } : {}) },
    signal,
  });
  child.on("error", (error) => {
    if (isAbortError(error)) return;
    console.error("Transcriber process encountered error", error);
  });
  printLinePrefix(`transcriber:${language}`, child.stderr);
  return Duplex.from({
    writable: child.stdin,
    readable: child.stdout,
  });
}

async function* parseNdjson(source) {
  for await (const line of createInterface({ input: source })) {
    if (line.trim()) {
      yield JSON.parse(line);
    }
  }
}

const input = PassThrough();

function out(data) {
  if (parentPort) {
    parentPort.postMessage(data);
  } else {
    console.log(JSON.stringify(data));
  }
}

const controller = new AbortController();
const { signal } = controller;

if (parentPort) {
  parentPort.on("message", (message) => {
    if (message.abort) {
      controller.abort();
    }
  });
}

try {
  await Promise.all([
    pipeline(input, new PassThrough(), createTranscriber("en", true, signal), async (source) => {
      for await (const event of parseNdjson(source)) {
        out({ result: event });
      }
    }),
    pipeline(input, new PassThrough(), createTranscriber("th", false, signal), async (source) => {
      for await (const event of parseNdjson(source)) {
        out({ resultTh: event });
      }
    }),
    pipeline(microphone(signal), input),
  ]);
} catch (error) {
  if (isAbortError(error)) {
    // Ignore
  } else {
    console.error("Pipeline error", error);
  }
}
