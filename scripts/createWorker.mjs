import { Worker } from "node:worker_threads";

export function createWorker(signal, callback) {
  const worker = new Worker("./scripts/worker.mjs");
  worker.on("message", callback);
  worker.on("error", (error) => {
    console.error("Worker encountered error", error);
  });
  let aborting = false;
  signal.addEventListener("abort", () => {
    worker.postMessage({ abort: true });
    if (!aborting) {
      aborting = true;
      setTimeout(() => {
        worker.terminate();
      }, 1000);
    }
  });
}
