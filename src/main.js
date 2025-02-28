import './theme.css'
import './style.css'
import { listenForUpdates } from './firebase'

const container = document.querySelector(".menu-container");

// Function to update the UI
const updateDOM = (data) => {
  console.log(JSON.parse(JSON.stringify(data)));
  container.innerHTML = "";

  for (let category of data) {
    const categoryDiv = createMenuCategory(category.categoryName, category.items);
    container.appendChild(categoryDiv);
  }
};

const createMenuItem = (itemName, price, stock, dietaryList = []) => {
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
  dietaryList.filter((dietary) => dietary != "*").forEach(dietary => {
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
  priceSpan.textContent = `$${price.toFixed(2)}`;

  itemDiv.appendChild(nameSpan);
  itemDiv.appendChild(priceSpan);

  return itemDiv;
}

const createMenuCategory = (categoryName, categoryItems) => {
  const categoryDiv = document.createElement("div");
  categoryDiv.classList.add("category");

  const header = document.createElement("h1");
  header.classList.add("header", `${categoryName.toLowerCase()}-header`);
  header.textContent = categoryName;

  categoryDiv.appendChild(header);
  
  const itemsDiv = document.createElement("div");
  itemsDiv.classList.add("items");

  categoryItems.forEach(item => {
    const itemDiv = createMenuItem(item.itemName, item.price, item.stock, item.flags);
    itemsDiv.appendChild(itemDiv);
  });

  categoryDiv.appendChild(itemsDiv);

  return categoryDiv;
}

// Start listening for Firebase updates
listenForUpdates(updateDOM);
