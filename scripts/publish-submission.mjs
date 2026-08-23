import { readFileSync, writeFileSync } from "node:fs";

const worksPath = "data/works.json";
const eventPath = process.env.GITHUB_EVENT_PATH;

if (!eventPath) {
  throw new Error("GITHUB_EVENT_PATH is missing.");
}

const event = JSON.parse(readFileSync(eventPath, "utf8"));
const issue = event.issue;

if (!issue?.body) {
  throw new Error("No issue body found.");
}

function getField(name) {
  const pattern = new RegExp(`### ${name}\\s+([\\s\\S]*?)(?=\\n### |$)`, "i");
  const match = issue.body.match(pattern);
  return match ? match[1].trim() : "";
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

function estimateReadTime(lines) {
  const words = lines.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
}

function makeExcerpt(lines) {
  const text = lines.join(" ").trim();
  return text.length <= 108 ? text : `${text.slice(0, 105).trim()}...`;
}

const type = getField("Type");
const title = getField("Title");
const content = getField("Content");
const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

if (!["Poem", "Story"].includes(type)) {
  throw new Error("Type must be Poem or Story.");
}

if (!title || lines.length === 0) {
  throw new Error("Title and content are required.");
}

const works = JSON.parse(readFileSync(worksPath, "utf8"));
const collection = type === "Poem" ? works.poems : works.stories;
const idBase = `${type.toLowerCase()}-${slugify(title)}`;
let id = idBase;
let counter = 2;

while (collection.some((item) => item.id === id)) {
  id = `${idBase}-${counter}`;
  counter += 1;
}

collection.unshift({
  id,
  title,
  date: type,
  readTime: estimateReadTime(lines),
  excerpt: makeExcerpt(lines),
  body: lines,
  isCommunity: true
});

writeFileSync(worksPath, `${JSON.stringify(works, null, 2)}\n`);
