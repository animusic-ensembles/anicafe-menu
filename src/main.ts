import { collection, onSnapshot, orderBy, query, type QuerySnapshot } from "firebase/firestore";
import { createDatabase } from "./firebase";
import { menuFromDocs } from "./fromFirestore";
import { columnCount, renderLegend, renderMenu, visibleCategories } from "./render";
import type { MenuCategory } from "./types";

const container = document.querySelector<HTMLElement>(".menu-container")!;
const status = document.querySelector<HTMLElement>(".menu-status")!;
const message = document.querySelector<HTMLElement>(".status-message")!;
const retry = document.querySelector<HTMLButtonElement>(".retry-button")!;
const legend = document.querySelector<HTMLElement>(".legend")!;

retry.addEventListener("click", () => window.location.reload());

interface ConnectionState {
  readonly receivedMenu: boolean;
  readonly fromCache: boolean;
  readonly failed: boolean;
  readonly online: boolean;
  readonly empty: boolean;
}

const statusMessage = ({ receivedMenu, fromCache, failed, online, empty }: ConnectionState) => {
  if (failed) {
    return receivedMenu
      ? "Menu updates stopped. Prices and stock may be out of date. Please retry."
      : "Unable to load the menu. Please retry.";
  }
  if (!online) {
    return receivedMenu
      ? "Offline. Prices and stock may be out of date."
      : "Offline. Waiting for a connection to load the menu…";
  }
  if (fromCache) {
    return receivedMenu
      ? "Reconnecting… Prices and stock may be out of date."
      : "Loading menu…";
  }
  return empty ? "No menu items available." : "";
};

const renderStatus = (state: ConnectionState) => {
  const text = statusMessage(state);
  message.textContent = text;
  status.hidden = !text;
  retry.hidden = !state.failed;
  container.setAttribute("aria-busy", String(!state.receivedMenu && !state.failed));
};

let state: ConnectionState = {
  receivedMenu: false,
  fromCache: true,
  failed: false,
  online: navigator.onLine,
  empty: true,
};

const updateState = (next: ConnectionState) => {
  state = next;
  renderStatus(state);
};

const updateConnection = () => updateState({ ...state, online: navigator.onLine });

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
renderStatus(state);

const aside = container.querySelector(".menu-aside");

const showMenu = (menu: MenuCategory[]) => {
  const columns = columnCount(menu);
  const categories = renderMenu(menu);
  // The aside follows the first category so CSS can end the first column after it.
  container.replaceChildren(...categories.slice(0, 1), ...(aside ? [aside] : []), ...categories.slice(1));
  container.style.setProperty("--columns", String(columns));
  container.classList.toggle("single-column", columns === 1);
  legend.replaceChildren(...renderLegend(menu));
  legend.hidden = legend.childElementCount === 0;
};

const showError = (error: unknown) => {
  console.error("Failed to load menu", error);
  updateState({ ...state, failed: true });
};

const showSnapshot = (snapshot: QuerySnapshot) => {
  const fromCache = snapshot.metadata.fromCache;
  // An empty cache is not confirmation that the server's menu is empty.
  const menu = fromCache && snapshot.empty ? null : menuFromDocs(snapshot.docs);
  if (menu !== null) showMenu(menu);
  updateState({
    ...state,
    fromCache,
    // A listener error ends the listener, so a later snapshot means rendering recovered.
    failed: false,
    receivedMenu: state.receivedMenu || menu !== null,
    empty: menu === null ? state.empty : visibleCategories(menu).length === 0,
  });
};

try {
  const db = createDatabase();
  onSnapshot(
    query(collection(db, "menu"), orderBy("categoryName")),
    { includeMetadataChanges: true },
    // Firestore calls this from a timer, so a throw here would otherwise bypass showError.
    (snapshot) => {
      try {
        showSnapshot(snapshot);
      } catch (error) {
        showError(error);
      }
    },
    showError,
  );
} catch (error) {
  showError(error);
}
