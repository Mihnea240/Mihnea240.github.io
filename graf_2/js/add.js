const colors = [
    "blueviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen",
    "darkslategray", "darkmagenta", "cornflowerblue", "crimson", "chocolate",
    "slateblue", "pink", "mediumseagreen","slategrey"
];
const newGraphButton = document.querySelector(".new-graph");
const tabArea = document.querySelector(".tab-area");
const headerArea = document.querySelector(".header");
const tab_template = elementFromHtml(`<graph-tab class="tab"></graph-tab>`);
const header_template = elementFromHtml(`<button class="graph-header selected"></button>`);

newGraphButton.addEventListener("click", (ev) => {
    createGraph();
    ev.stopImmediatePropagation(); ev.stopPropagation();
})

headerArea.addEventListener("click", (ev) => {
    if (!ev.target.classList.contains("graph-header")) return;

    let newSelected = graphs.get(parseInt(ev.target.getAttribute("data-id")));
    newSelected.focus();
})


shuffleArray(colors);
let colorIndex = 1;


function createTabUI(id) {
    let newTab=tabArea.appendChild(tab_template.cloneNode(true));
    let newHeader = headerArea.insertBefore(header_template.cloneNode(true), newGraphButton);
    newTab.setAttribute("data-id", id);
    newHeader.setAttribute("data-id", id);
    
    //selectedHeader.style.backgroundColor = colors[colorIndex];
    let gradient = `linear-gradient(45deg,${colors[colorIndex - 1]},${colors[colorIndex]})`;
    colorIndex++;
    newHeader.style.cssText +=`background: ${gradient};`;

    headerArea.style.cssText += `border-image: ${gradient} 1`;
    if (colorIndex >= colors.length) {
        shuffleArray(colors);
        colorIndex = 1;
    }

    newHeader.textContent = "New graph " + id;
}