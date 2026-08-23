const defaultWorks = {
  poems: [
    {
      title: "Blue Silence",
      date: "Poem",
      readTime: "2 min read",
      excerpt: "A soft opening poem for evenings, rain, and the quiet after a thought.",
      body: [
        "The sky folds itself into a bowl of blue,",
        "and I place my tired heart inside it.",
        "No thunder asks for my answer tonight,",
        "only the window, breathing white light.",
        "Somewhere a flute remembers the river,",
        "somewhere the moon learns my name.",
        "I become less storm, more shore,",
        "less hurry, more flame."
      ]
    },
    {
      title: "After the Rain",
      date: "Poem",
      readTime: "1 min read",
      excerpt: "A gentle piece about new beginnings after a heavy day.",
      body: [
        "After the rain, even the road looks forgiven.",
        "Leaves hold small mirrors to the morning.",
        "I walk slowly, as if the world might speak,",
        "as if every puddle has kept a secret for me."
      ]
    },
    {
      title: "Paper Boat",
      date: "Poem",
      readTime: "2 min read",
      excerpt: "A small dream set afloat on calm water.",
      body: [
        "I made a boat from a page I could not finish,",
        "creased it with hope, sent it into rainwater.",
        "It did not know the ocean.",
        "Still, it moved like it believed."
      ]
    }
  ],
  stories: [
    {
      title: "The Lantern Keeper",
      date: "Story",
      readTime: "4 min read",
      excerpt: "A quiet fantasy about a village that saves its memories in blue lanterns.",
      body: [
        "Every evening, Aran lit the lanterns before the first star appeared. The village said the lamps kept darkness away, but Aran knew the older truth: each flame carried a memory someone was afraid to lose.",
        "One night, a lantern burned white instead of blue. Inside it, he saw a road, a letter, and a girl laughing beside the sea. By morning, the whole village had gathered to ask whose memory had returned.",
        "Aran did not answer quickly. Some memories arrive like guests. Some arrive like rain. This one arrived like a door."
      ]
    },
    {
      title: "A House Made of Wind",
      date: "Story",
      readTime: "3 min read",
      excerpt: "A reflective short story about home, distance, and the things we carry.",
      body: [
        "The old house had no walls by the time Mira returned, only four stone corners and the smell of jasmine after sunset.",
        "She stood where the kitchen used to be and listened. The wind moved through the empty rooms as if it still knew where everything belonged.",
        "Mira smiled. Some homes are not built to remain. Some are built to follow."
      ]
    }
  ]
};

const creations = [
  {
    title: "Moon Notes",
    kind: "Draft",
    text: "A collection of one-line thoughts for future poems."
  },
  {
    title: "Quiet Characters",
    kind: "Sketch",
    text: "Names, moods, and fragments for stories still becoming themselves."
  },
  {
    title: "Blue Archive",
    kind: "Idea",
    text: "A future gallery for artwork, recordings, and handwritten pages."
  }
];

const storageKey = "rudhra-creations-works";
const githubRepo = document.querySelector('meta[name="github-repo"]')?.content.trim();
const poemGrid = document.querySelector("#poemGrid");
const storyGrid = document.querySelector("#storyGrid");
const creationList = document.querySelector("#creationList");
const searchInput = document.querySelector("#searchInput");
const searchStatus = document.querySelector("#searchStatus");
const splash = document.querySelector("#splash");
const openAddForm = document.querySelector("#openAddForm");
const addModal = document.querySelector("#addModal");
const addForm = document.querySelector("#addForm");
const publishButton = document.querySelector("#publishButton");
const workType = document.querySelector("#workType");
const workTitle = document.querySelector("#workTitle");
const workAuthor = document.querySelector("#workAuthor");
const workPlace = document.querySelector("#workPlace");
const workContent = document.querySelector("#workContent");
const reader = document.querySelector("#reader");
const readerType = document.querySelector("#readerType");
const readerTitle = document.querySelector("#readerTitle");
const readerMeta = document.querySelector("#readerMeta");
const readerBody = document.querySelector("#readerBody");
const closeReader = document.querySelector("#closeReader");
const musicToggle = document.querySelector("#musicToggle");
const musicLabel = document.querySelector("#musicLabel");

let works = loadWorks();
assignIds(works);
let audioContext;
let masterGain;
let delayNode;
let musicTimer;
let musicPlaying = false;

function cloneDefaultWorks() {
  return JSON.parse(JSON.stringify(defaultWorks));
}

function loadWorks() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return cloneDefaultWorks();

  try {
    const parsed = JSON.parse(saved);
    return {
      poems: [...defaultWorks.poems, ...(parsed.poems || [])],
      stories: [...defaultWorks.stories, ...(parsed.stories || [])]
    };
  } catch {
    return cloneDefaultWorks();
  }
}

async function loadPublicWorks() {
  try {
    const response = await fetch("data/works.json", { cache: "no-store" });
    if (!response.ok) return;

    const publicWorks = await response.json();
    works = {
      poems: [...(publicWorks.poems || []), ...works.poems.filter((item) => item.isCustom)],
      stories: [...(publicWorks.stories || []), ...works.stories.filter((item) => item.isCustom)]
    };
    assignIds(works);
    renderAll();
  } catch {
    // Local file previews can block fetch; the built-in works still render.
  }
}

function saveCustomWorks() {
  const savedWorks = {
    poems: works.poems.filter((item) => item.isCustom),
    stories: works.stories.filter((item) => item.isCustom)
  };
  localStorage.setItem(storageKey, JSON.stringify(savedWorks));
}

function assignIds(collections) {
  [...collections.poems, ...collections.stories].forEach((item, index) => {
    if (!item.id) {
      item.id = `${item.date.toLowerCase()}-${index}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    }
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function estimateReadTime(lines) {
  const words = lines.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 180))} min read`;
}

function makeExcerpt(lines) {
  const text = lines.join(" ").trim();
  if (text.length <= 108) return text;
  return `${text.slice(0, 105).trim()}...`;
}

function getFilteredWorks() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = (item) => {
    if (!query) return true;
    const searchable = `${item.title} ${item.author || ""} ${item.place || ""} ${item.excerpt} ${item.body.join(" ")}`.toLowerCase();
    return searchable.includes(query);
  };

  return {
    poems: works.poems.filter(filter),
    stories: works.stories.filter(filter),
    query
  };
}

function renderCards(items, container, type) {
  container.innerHTML = items
    .map(
      (item) => `
        <button class="work-card" data-type="${type}" data-id="${escapeHtml(item.id)}">
          <span>
            <span class="card-meta">
              <span>${escapeHtml(item.date)}</span>
              <span>${escapeHtml(item.readTime)}</span>
            </span>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="byline">${escapeHtml(formatAuthorPlace(item))}</p>
            <p>${escapeHtml(item.excerpt)}</p>
          </span>
          <span class="card-meta">
            <span>${item.isCustom ? "Community" : "Featured"}</span>
            <span>Full screen</span>
          </span>
        </button>
      `
    )
    .join("");

  [...container.querySelectorAll(".work-card")].forEach((card, index) => {
    card.style.animationDelay = `${index * 45}ms`;
  });
}

function renderCreations() {
  creationList.innerHTML = creations
    .map(
      (item) => `
        <article class="creation-item">
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.text)}</p>
          </div>
          <span>${escapeHtml(item.kind)}</span>
        </article>
      `
    )
    .join("");
}

function formatAuthorPlace(item) {
  const author = item.author?.trim();
  const place = item.place?.trim();
  if (author && place) return `By ${author} from ${place}`;
  if (author) return `By ${author}`;
  if (place) return `From ${place}`;
  return "By Rudhra Creations";
}

function renderAll() {
  const filtered = getFilteredWorks();
  renderCards(filtered.poems, poemGrid, "Poem");
  renderCards(filtered.stories, storyGrid, "Story");

  if (filtered.query) {
    const total = filtered.poems.length + filtered.stories.length;
    searchStatus.textContent = `${total} result${total === 1 ? "" : "s"} for "${filtered.query}"`;
  } else {
    searchStatus.textContent = "Search reads titles, descriptions, and every word inside the writing.";
  }
}

function createAudioGraph() {
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  delayNode = audioContext.createDelay(1.4);
  const feedback = audioContext.createGain();

  masterGain.gain.value = 0.18;
  delayNode.delayTime.value = 0.34;
  feedback.gain.value = 0.28;

  masterGain.connect(audioContext.destination);
  masterGain.connect(delayNode);
  delayNode.connect(feedback);
  feedback.connect(delayNode);
  delayNode.connect(audioContext.destination);
}

function playFluteNote(frequency, start, duration) {
  const oscillator = audioContext.createOscillator();
  const toneGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.detune.setValueAtTime(Math.random() * 7 - 3.5, start);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1280, start);
  filter.Q.value = 2.2;

  toneGain.gain.setValueAtTime(0.0001, start);
  toneGain.gain.exponentialRampToValueAtTime(0.18, start + 0.18);
  toneGain.gain.exponentialRampToValueAtTime(0.08, start + duration * 0.72);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(filter);
  filter.connect(toneGain);
  toneGain.connect(masterGain);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.04);
}

function scheduleFlutePhrase() {
  if (!musicPlaying || !audioContext) return;

  const scale = [392, 440, 493.88, 587.33, 659.25, 739.99];
  const now = audioContext.currentTime + 0.08;
  const notes = [0, 2, 4, 3, 2, 1, 3, 5].map((step) => scale[step]);
  notes.forEach((frequency, index) => {
    playFluteNote(frequency, now + index * 0.72, 0.58 + Math.random() * 0.24);
  });

  musicTimer = window.setTimeout(scheduleFlutePhrase, 6900);
}

async function startMusic() {
  if (!audioContext) createAudioGraph();
  if (audioContext.state === "suspended") await audioContext.resume();
  if (musicPlaying) return;
  musicPlaying = true;
  musicToggle.classList.remove("is-muted");
  musicLabel.textContent = "Flute on";
  scheduleFlutePhrase();
}

function stopMusic() {
  musicPlaying = false;
  window.clearTimeout(musicTimer);
  musicToggle.classList.add("is-muted");
  musicLabel.textContent = "Flute off";
}

function openReader(item, type) {
  readerType.textContent = type;
  readerTitle.textContent = item.title;
  readerMeta.textContent = `${formatAuthorPlace(item)} - ${item.date} - ${item.readTime}`;
  readerBody.innerHTML = item.body.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  reader.classList.add("is-open");
  reader.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  startMusic();
}

function closeReaderView() {
  reader.classList.remove("is-open");
  reader.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  stopMusic();
}

function openModal() {
  addModal.classList.add("is-open");
  addModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  window.setTimeout(() => workTitle.focus(), 80);
}

function closeModal() {
  addModal.classList.remove("is-open");
  addModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function flashSplash() {
  splash.classList.add("flash-again");
  splash.classList.remove("is-flashing");
  window.requestAnimationFrame(() => splash.classList.add("is-flashing"));
}

async function publishOnline(payload) {
  if (window.location.protocol === "file:") {
    return { work: null, localOnly: true };
  }

  const response = await fetch("/.netlify/functions/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Could not publish right now.");
  }

  return result;
}

function findWork(type, id) {
  const collection = type === "Poem" ? works.poems : works.stories;
  return collection.find((item) => item.id === id);
}

document.addEventListener("click", (event) => {
  const card = event.target.closest(".work-card");
  if (!card) return;

  const item = findWork(card.dataset.type, card.dataset.id);
  if (item) openReader(item, card.dataset.type);
});

openAddForm.addEventListener("click", openModal);

addModal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) closeModal();
});

addForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const type = workType.value;
  const title = workTitle.value.trim();
  const author = workAuthor.value.trim();
  const place = workPlace.value.trim();
  const lines = workContent.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!title || !author || !place || !lines.length) return;

  const pendingWork = {
    id: `${type.toLowerCase()}-${Date.now()}`,
    title,
    author,
    place,
    date: type,
    readTime: estimateReadTime(lines),
    excerpt: makeExcerpt(lines),
    body: lines,
    isCustom: true
  };

  publishButton.disabled = true;
  publishButton.textContent = "Publishing...";

  let publishedWork = pendingWork;
  try {
    const result = await publishOnline({
      type,
      title,
      author,
      place,
      content: workContent.value.trim()
    });
    if (result.work) {
      publishedWork = result.work;
    }
  } catch (error) {
    publishButton.disabled = false;
    publishButton.textContent = "Publish";
    window.alert(error.message);
    return;
  }

  if (type === "Poem") {
    works.poems.unshift(publishedWork);
  } else {
    works.stories.unshift(publishedWork);
  }

  if (publishedWork.isCustom) saveCustomWorks();
  addForm.reset();
  closeModal();
  flashSplash();
  renderAll();
  publishButton.disabled = false;
  publishButton.textContent = "Publish";
  document.querySelector(type === "Poem" ? "#poems" : "#stories").scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", renderAll);
closeReader.addEventListener("click", closeReaderView);

musicToggle.addEventListener("click", () => {
  if (musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (reader.classList.contains("is-open")) {
    closeReaderView();
  } else if (addModal.classList.contains("is-open")) {
    closeModal();
  }
});

renderAll();
renderCreations();
loadPublicWorks();
