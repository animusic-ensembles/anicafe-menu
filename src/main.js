import './style.css'
import { listenForUpdates } from './firebase'

const container = document.querySelector(".menu-container");

const FALLBACK_COLORS = ["--drinks-color", "--food-color", "--specialty-color"];

// Category names are free-form and must become valid class and variable names.
const toSlug = (name) =>
  String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Older menus stored dollars in `price`.
const toCents = (item) =>
  typeof item.priceCents === "number" ? item.priceCents
    : typeof item.price === "number" ? Math.round(item.price * 100)
    : 0;

// Function to update the UI
const updateDOM = (data) => {
  console.log(JSON.parse(JSON.stringify(data)));
  container.innerHTML = "";

  data
    .filter((category) => category.categoryName && category.items?.length)
    .forEach((category, index) => {
      container.appendChild(createMenuCategory(category.categoryName, category.items, index));
    });
};

const createMenuItem = (itemName, priceCents, stock, dietaryList = []) => {
  const itemDiv = document.createElement("div");
  itemDiv.classList.add("item");
  if (stock == "none") {
    itemDiv.classList.add("strikethrough");
  }
  
  const nameSpan = document.createElement("span");
  nameSpan.classList.add("item-name");

  const nameText = document.createElement("span");
  nameText.textContent = itemName + (dietaryList.includes("*") ? "*" : "");

  nameSpan.appendChild(nameText);

  if (stock == "low") {
    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.setAttribute("role", "img");
    svgIcon.classList.add("item-low-stock-icon", "low-stock-icon");

    const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
    useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#low-stock");
    
    svgIcon.appendChild(useElement);
    nameSpan.appendChild(svgIcon);
  }
  // Custom flags have no icon.
  dietaryList.filter((dietary) => dietary != "*" && document.getElementById(dietary)).forEach(dietary => {
    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.setAttribute("role", "img");
    svgIcon.classList.add(`${dietary}-icon`, "dietary-icon");

    const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
    useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${dietary}`);

    svgIcon.appendChild(useElement);
    nameSpan.appendChild(svgIcon);
  });

  const priceSpan = document.createElement("span");
  priceSpan.classList.add("item-price");
  priceSpan.textContent = `$${(priceCents / 100).toFixed(2)}`;

  itemDiv.appendChild(nameSpan);
  itemDiv.appendChild(priceSpan);

  return itemDiv;
}

const createMenuCategory = (categoryName, categoryItems, index) => {
  const categoryDiv = document.createElement("div");
  categoryDiv.classList.add("category");

  const header = document.createElement("h1");
  const slug = toSlug(categoryName);
  header.classList.add("header");
  if (slug) {
    header.classList.add(`${slug}-header`);
  }
  const fallback = `var(${FALLBACK_COLORS[index % FALLBACK_COLORS.length]})`;
  header.style.setProperty("--category-color", slug ? `var(--${slug}-color, ${fallback})` : fallback);
  header.textContent = categoryName;

  categoryDiv.appendChild(header);
  
  const itemsDiv = document.createElement("div");
  itemsDiv.classList.add("items");

  categoryItems.forEach(item => {
    const itemDiv = createMenuItem(item.itemName, toCents(item), item.stock, item.flags);
    itemsDiv.appendChild(itemDiv);
  });

  categoryDiv.appendChild(itemsDiv);

  return categoryDiv;
}

// Start listening for Firebase updates
listenForUpdates(updateDOM);
