import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { MenuCategory, MenuItem } from "./types";

// Menu docs are hand-edited, so one malformed field must not take down the whole menu.
const isRecord = (value: unknown): value is DocumentData => typeof value === "object" && value !== null;

const asString = (value: unknown) => (value == null ? "" : String(value));

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const isFiniteNumber = (value: unknown): value is number => Number.isFinite(value);

// Older menus stored dollars in `price`.
const toCents = (priceCents: unknown, dollars: unknown) =>
  isFiniteNumber(priceCents) ? priceCents : isFiniteNumber(dollars) ? Math.round(dollars * 100) : 0;

const toMenuItem = (item: DocumentData): MenuItem => ({
  itemName: asString(item.itemName),
  priceCents: toCents(item.priceCents, item.price),
  stock: item.stock,
  flags: asArray(item.flags).filter((flag): flag is string => typeof flag === "string"),
});

const menuCategoryFromDoc = (snapshot: QueryDocumentSnapshot<DocumentData>): MenuCategory => {
  const data = snapshot.data();
  return {
    categoryName: asString(data.categoryName),
    ...(isFiniteNumber(data.position) && { position: data.position }),
    items: asArray(data.items).filter(isRecord).map(toMenuItem),
  };
};

// Categories saved before ordering was added have no position, so they go last.
const byPosition = (a: MenuCategory, b: MenuCategory) =>
  (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER);

// Docs arrive in name order, and the stable sort keeps it for ties.
export const menuFromDocs = (docs: QueryDocumentSnapshot<DocumentData>[]) =>
  docs.map(menuCategoryFromDoc).sort(byPosition);
