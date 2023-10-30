const colors = [
    "bluviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen",
    "darkslategray", "darkmagenta", "cornflowerblue", "crimson", "chocolate",
    "green", "gold", "deeppink", "slateblue", "orange", "pink", "mediumseagreen",
];
const newGraphButton = document.querySelector(".new-graph");
const tabArea = document.querySelector(".tab-area");
const headerArea = document.querySelector(".header");
const tab_template = elementFromHtml(`<graph-tab class="tab"></graph-tab>`);
const header_template = elementFromHtml(`<button class="graph-header"></button>`);

newGraphButton.addEventListener("click", (ev) => {
    createTabUI();
})


shuffleArray(colors);
let colorIndex = 0;

function hideTabs() {
    let children = tabArea.children;
    for (el of children) {
        el.classList.add("hide");
    }
}

function createTabUI() {
    hideTabs();
    let newTab=tabArea.appendChild(tab_template.cloneNode(true));
    let newHeader = headerArea.insertBefore(header_template.cloneNode(true),newGraphButton);
    
    newHeader.style.backgroundColor = colors[colorIndex];
    headerArea.style.cssText += `border-bottom: 3px solid ${colors[colorIndex++]}`;
    if (colorIndex >= colors.length) {
        shuffleArray(colors);
        colorIndex = 0;
    }

    newHeader.textContent = "New graph";
}

function formatData() {
    
}

function createGraph() {
    createTabUI();
}