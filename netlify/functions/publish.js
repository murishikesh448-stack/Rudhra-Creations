const repo = process.env.GITHUB_REPO || "murishikesh448-stack/Rudhra-Creations";
const branch = process.env.GITHUB_BRANCH || "main";
const worksPath = "data/works.json";

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
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

function decodeBase64(value) {
  return Buffer.from(value, "base64").toString("utf8");
}

function encodeBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  if (!process.env.GITHUB_TOKEN) {
    return json(500, { error: "GITHUB_TOKEN is not configured in Netlify." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON." });
  }

  const type = String(payload.type || "").trim();
  const title = String(payload.title || "").trim();
  const author = String(payload.author || "").trim();
  const place = String(payload.place || "").trim();
  const content = String(payload.content || "").trim();
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (!["Poem", "Story"].includes(type)) {
    return json(400, { error: "Choose Poem or Story." });
  }

  if (!title || !author || !place || lines.length === 0) {
    return json(400, { error: "Title, author, place, and content are required." });
  }

  const url = `https://api.github.com/repos/${repo}/contents/${worksPath}?ref=${branch}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "User-Agent": "rudhra-creations-netlify"
  };

  const currentResponse = await fetch(url, { headers });
  if (!currentResponse.ok) {
    return json(500, { error: "Could not read the public writing database." });
  }

  const currentFile = await currentResponse.json();
  const works = JSON.parse(decodeBase64(currentFile.content));
  const collection = type === "Poem" ? works.poems : works.stories;
  const idBase = `${type.toLowerCase()}-${slugify(title)}`;
  let id = idBase;
  let counter = 2;

  while (collection.some((item) => item.id === id)) {
    id = `${idBase}-${counter}`;
    counter += 1;
  }

  const newWork = {
    id,
    title,
    author,
    place,
    date: type,
    readTime: estimateReadTime(lines),
    excerpt: makeExcerpt(lines),
    body: lines,
    isCommunity: true
  };

  collection.unshift(newWork);

  const updateResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${worksPath}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `Publish ${type.toLowerCase()}: ${title}`,
      content: encodeBase64(`${JSON.stringify(works, null, 2)}\n`),
      sha: currentFile.sha,
      branch
    })
  });

  if (!updateResponse.ok) {
    return json(500, { error: "Could not publish right now. Please try again." });
  }

  return json(200, { work: newWork });
};
