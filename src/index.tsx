import { ActionPanel, Action, List } from "@raycast/api";
import fetch, { Response } from "node-fetch";
import { atom, onMount } from "nanostores";
import { useStore } from "@nanostores/react";
import { readFileSync } from "fs";

const secretPath = process.env.HOME + "/Raycast/Extensions/what-you-said/.data/secret.txt";
const secret = readFileSync(secretPath, "utf8").trim();

const $transcription = atom<TranscriptionResponse | null>(null);

onMount($transcription, () => {
  let time = "";
  async function handle(response: Response) {
    if (!response.ok) return;
    try {
      const d = (await response.json()) as any;
      if (d.time > time) {
        time = d.time;
        $transcription.set(d);
      }
    } catch (e) {
      console.error(e);
    }
  }
  let unmounted = false;
  (async () => {
    {
      const initialResponse = await fetch("http://127.0.0.1:7826/transcription?t=" + Date.now(), {
        headers: {
          Authorization: "Bearer " + secret,
        },
      });
      await handle(initialResponse);
    }
    while (!unmounted) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        const response = await fetch("http://127.0.0.1:7826/poll?time=" + encodeURIComponent(time), {
          headers: {
            Authorization: "Bearer " + secret,
          },
        });
        await handle(response);
      } catch (e) {
        console.error(e);
      }
    }
  })();
  return () => {
    unmounted = true;
  };
});

export default function Command() {
  const data = useStore($transcription);
  const result = data?.result;

  return (
    <List
      isLoading={!result}
      // onSearchTextChange={setSearchText}
      searchBarPlaceholder="Press enter to paste into frontmost application"
      throttle
      isShowingDetail
    >
      <List.Section title="What you said">
        {!!result &&
          candidates(result.text).map((text) => (
            <List.Item
              title={text}
              subtitle={relativeTime(data.time)}
              actions={
                <ActionPanel>
                  <ActionPanel.Section>
                    <Action.Paste title="Type" content={text} />
                    <Action.CopyToClipboard
                      title="Copy"
                      content={text}
                      shortcut={{ modifiers: ["opt"], key: "return" }}
                    />
                    <Action.CopyToClipboard title="Copy Raw JSON" content={JSON.stringify(data)} />
                  </ActionPanel.Section>
                </ActionPanel>
              }
              detail={<List.Item.Detail markdown={toMarkdown(result, text)} />}
            />
          ))}
      </List.Section>
    </List>
  );
}

interface TranscriptionResponse {
  result: TranscriptionResult;
  time: string;
}
interface TranscriptionResult {
  segments: [
    textStartIndex: number,
    textLength: number,
    confidence: number,
    timeStartSeconds: number,
    durationSeconds: number
  ][];
  isFinal: boolean;
  text: string;
}

function candidates(text: string): string[] {
  if (!text.trim()) return [];

  const result = new Set([text]);

  // With first letter converted into lower case
  result.add(text.replace(/^[A-Z]/, (a) => a.toLocaleLowerCase()));

  if (text.length < 32) {
    const pascal = text.replace(/\s+(\S)/g, (a, x) => x.toLocaleUpperCase()).replace(/ID/g, "Id");
    result.add(pascal);

    const camel = pascal.replace(/^[A-Z]/, (a) => a.toLocaleLowerCase());
    result.add(camel);

    const kebab = camel.replace(/[A-Z]/g, (a) => "-" + a.toLocaleLowerCase());
    result.add(kebab);

    const snake = camel.replace(/[A-Z]/g, (a) => "_" + a.toLocaleLowerCase());
    result.add(snake);
  }

  return Array.from(result);
}

function relativeTime(time: string) {
  const diff = Date.now() - Date.parse(time);
  const s = Math.floor(diff / 1000);
  if (s < 60) return s + "s";
  return Math.floor(s / 60) + "m" + (s % 60) + "s";
}

function toMarkdown(result: TranscriptionResult, text: string): string {
  const confidence = result.segments.map((s) => s[2]).reduce((a, b) => a + b, 0) / result.segments.length;
  const prefix = confidence > 0.5 ? "# " : "## ";
  return prefix + text;
}
