import * as fs from "node:fs";
import * as path from "node:path";

type StoryEntry = {
  id: string;
  title: string;
  name: string;
  importPath: string;
};

type IndexJson = {
  v: number;
  entries: Record<string, { type: string } & Partial<StoryEntry>>;
};

export function loadStories(staticDir: string): StoryEntry[] {
  const indexPath = path.join(staticDir, "index.json");
  const data: IndexJson = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  return Object.values(data.entries).filter(
    (entry): entry is { type: "story" } & StoryEntry =>
      entry.type === "story" &&
      typeof entry.title === "string" &&
      entry.title.startsWith("Pages/"),
  );
}

export function getStoryUrl(storyId: string): string {
  return `/iframe.html?id=${storyId}&viewMode=story`;
}
