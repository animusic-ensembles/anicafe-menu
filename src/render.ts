import type { MenuCategory, MenuItem } from "./types";
import { DIETARY_FLAGS, LOW_STOCK, PORK_FLAG } from "./flags";

const SVG_NS = "http://www.w3.org/2000/svg";

const FALLBACK_COLORS = ["--drinks-color", "--food-color", "--specialty-color"];

const MAX_COLUMNS = 3;

const HEADER_ROWS = 1.5;

// Text scales with viewport height on landscape screens, so a screen holds about this many rows.
const ROWS_PER_COLUMN = 10;

interface Options {
  classes?: string[];
  attributes?: Record<string, string>;
  style?: Record<string, string>;
}

interface MenuSymbol {
  id: string;
  label: string;
}

const element = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  { classes = [], attributes = {}, style = {} }: Options = {},
  children: (Node | string)[] = [],
) => {
  const node = document.createElement(tag);
  node.classList.add(...classes);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  Object.entries(style).forEach(([property, value]) => node.style.setProperty(property, value));
  node.append(...children);
  return node;
};

const svgIcon = (id: string, classes: string[], attributes: Record<string, string>) => {
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `${import.meta.env.BASE_URL}icons.svg#${id}`);
  const svg = document.createElementNS(SVG_NS, "svg");
  Object.entries(attributes).forEach(([name, value]) => svg.setAttribute(name, value));
  svg.classList.add(...classes);
  svg.append(use);
  return svg;
};

const icon = ({ id, label }: MenuSymbol, classes: string[]) =>
  svgIcon(id, classes, { role: "img", "aria-label": label });

// Legend icons sit next to their own text label, so announcing them would repeat it.
const decorativeIcon = ({ id }: MenuSymbol, classes: string[]) => svgIcon(id, classes, { "aria-hidden": "true" });

const visuallyHidden = (text: string) => element("span", { classes: ["visually-hidden"] }, [text]);

const when = <T>(condition: boolean, value: T) => (condition ? [value] : []);

// Category names are free-form and must become valid class and variable names.
const toSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const dietaryFlags = (flags: string[]) => DIETARY_FLAGS.filter(({ id }) => flags.includes(id));

const splitLastWord = (text: string) => {
  const trimmed = text.trim();
  const index = trimmed.lastIndexOf(" ") + 1;
  return [trimmed.slice(0, index), trimmed.slice(index)];
};

const itemName = ({ itemName, stock, flags }: MenuItem) => {
  const [leadingWords, lastWord] = splitLastWord(itemName);
  return element("span", { classes: ["item-name"] }, [
    leadingWords,
    // The last word keeps the markers and leader with it so none of them wrap onto a line alone,
    // and the leader inside the name starts its dots right after the last line.
    element("span", { classes: ["item-name-end"] }, [
      lastWord,
      ...when(
        flags.includes(PORK_FLAG.id),
        element("span", { attributes: { role: "img", "aria-label": PORK_FLAG.label } }, [PORK_FLAG.id]),
      ),
      ...when(stock === "none", visuallyHidden("Sold out")),
      ...when(stock === "low", icon(LOW_STOCK, ["item-low-stock-icon", "low-stock-icon"])),
      ...dietaryFlags(flags).map((flag) => icon(flag, [`${flag.id}-icon`, "dietary-icon"])),
      element("span", { classes: ["item-leader"], attributes: { "aria-hidden": "true" } }),
    ]),
  ]);
};

const menuItem = (item: MenuItem) =>
  element("li", { classes: ["item", ...when(item.stock === "none", "strikethrough")] }, [
    itemName(item),
    element("span", { classes: ["item-price"] }, [formatPrice(item.priceCents)]),
  ]);

const headerColor = (slug: string, index: number) => {
  const fallback = `var(${FALLBACK_COLORS[index % FALLBACK_COLORS.length]})`;
  return slug ? `var(--${slug}-color, ${fallback})` : fallback;
};

const menuCategory = ({ categoryName, items }: MenuCategory, index: number) => {
  const slug = toSlug(categoryName);
  return element("section", { classes: ["category"] }, [
    element(
      "h2",
      {
        classes: ["header", ...when(Boolean(slug), `${slug}-header`)],
        style: { "--category-color": headerColor(slug, index) },
      },
      [categoryName],
    ),
    element("ul", { classes: ["items"] }, items.map(menuItem)),
  ]);
};

export const visibleCategories = (menu: MenuCategory[]) =>
  menu.filter((category) => category.categoryName && category.items.length > 0);

// Categories stay whole and in order, so filling each column before starting the next uses the fewest columns.
const columnsToFit = (heights: number[]) =>
  heights.reduce(
    ({ columns, used }, height) =>
      used === 0 || used + height <= ROWS_PER_COLUMN
        ? { columns, used: used + height }
        : { columns: columns + 1, used: height },
    { columns: 1, used: 0 },
  ).columns;

// Fewer, wider columns keep names from wrapping, so only add columns when the menu would not fit otherwise.
export const columnCount = (menu: MenuCategory[]) => {
  const heights = visibleCategories(menu).map((category) => category.items.length + HEADER_ROWS);
  const total = heights.reduce((sum, height) => sum + height, 0);
  // Categories never split across columns, so beyond this the tallest one sets the height anyway.
  const usefulColumns = heights.length ? Math.ceil(total / Math.max(...heights)) : 1;
  return Math.min(columnsToFit(heights), usefulColumns, MAX_COLUMNS);
};

export const renderMenu = (menu: MenuCategory[]) => visibleCategories(menu).map(menuCategory);

export const renderLegend = (menu: MenuCategory[]) => {
  const items = visibleCategories(menu).flatMap((category) => category.items);
  const flags = items.flatMap((item) => item.flags);
  return [
    ...when(items.some((item) => item.stock === "low"), LOW_STOCK),
    ...dietaryFlags(flags),
  ]
    .map((flag) => element("span", {}, [decorativeIcon(flag, [`${flag.id}-icon`, "legend-icon"]), flag.label]))
    .concat(
      when(
        flags.includes(PORK_FLAG.id),
        element("span", {}, [
          element("span", { attributes: { "aria-hidden": "true" } }, [PORK_FLAG.id]),
          PORK_FLAG.label,
        ]),
      ),
    );
};
