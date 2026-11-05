const SLIDE_MS = 10_000;
const SETLIST_POLL_MS = 30_000;

const SETLIST_URL = `https://docs.google.com/spreadsheets/d/1PUxVDHJ1pWjaCeNkdItMfgorH64ZjHvEUDBD6sVOHow/gviz/tq?${new URLSearchParams(
  {
    tqx: "out:json",
    sheet: "Order",
    headers: "1",
    tq: "select B, C, G where B is not null",
  },
)}`;

interface Row {
  lead: string;
  text: string;
  note?: string;
}

interface Song {
  title: string;
  runner: string;
  started: boolean;
}

interface Cell {
  v: unknown;
}

const slides = document.querySelectorAll(".whats-on-slide");
const dots = document.querySelectorAll(".whats-on-dot");
const setlist = document.querySelector("[data-setlist]");

const showCurrentSlide = () => {
  const current = Math.floor(Date.now() / SLIDE_MS) % slides.length;
  [slides, dots].forEach((items) =>
    items.forEach((item, index) => item.classList.toggle("is-current", index === current)),
  );
};

const element = (tag: string, className: string, children: (Node | string)[]) => {
  const node = document.createElement(tag);
  node.className = className;
  node.append(...children);
  return node;
};

const row = ({ lead, text, note }: Row) =>
  element("li", "whats-on-row", [
    element("span", "whats-on-lead", [lead]),
    element("span", "", [text, ...(note ? [element("span", "whats-on-note", [note])] : [])]),
  ]);

// The response is JSON wrapped in a JavaScript callback.
const parseSetlist = (response: string): Song[] =>
  JSON.parse(response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1))
    .table.rows.map(({ c }: { c: (Cell | null)[] }) => ({
      // Guest acts are marked with a trailing asterisk for the crew.
      title: String(c[0]?.v ?? "").replace(/\*?\s*$/, ""),
      runner: String(c[1]?.v ?? "").trim(),
      started: c[2]?.v === true,
    }))
    .filter(({ title }: Song) => title);

// The crew ticks each song as it starts, so the last ticked one is playing or has just finished.
const nowAndNext = (songs: Song[]): Row[] => {
  const playing = songs.map(({ started }) => started).lastIndexOf(true);
  const next = songs[playing + 1];
  return playing < 0
    ? []
    : [
        { lead: "Now", text: songs[playing].title, note: songs[playing].runner },
        ...(next ? [{ lead: "Next", text: next.title, note: next.runner }] : []),
      ];
};

const showSetlist = async () => {
  try {
    const response = await fetch(SETLIST_URL);
    if (!response.ok) return;
    const rows = nowAndNext(parseSetlist(await response.text()));
    // Before the first song is ticked, the slide keeps its general description.
    if (rows.length > 0) setlist?.replaceChildren(...rows.map(row));
  } catch (error) {
    console.warn("Failed to load the setlist", error);
  }
};

showCurrentSlide();
setInterval(showCurrentSlide, 1000);
showSetlist();
setInterval(showSetlist, SETLIST_POLL_MS);
