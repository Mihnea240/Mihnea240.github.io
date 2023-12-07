const colors = [
    "blueviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen",
    "darkslategray", "darkmagenta", "cornflowerblue", "crimson", "chocolate",
    "slateblue", "pink", "mediumseagreen","slategrey"
];
const newGraphButton = document.querySelector(".new-graph");
const tabArea = document.querySelector(".tab-area");
const headerArea = document.querySelector(".header");
const tab_template = elementFromHtml(`<graph-tab class="tab"></graph-tab>`);
const header_template = elementFromHtml(`
    <button class="graph-header selected">
        <span class="text" spellcheck="false"></span>
    </button>
`);
const graphDialog = document.querySelector("graph-menu");


headerArea.addEventListener("click", (ev) => {
    if (ev.target.classList.contains("new-graph")) {
        ev.stopImmediatePropagation(); ev.stopPropagation();
        graphDialog.open();
        return;
    }
    if (ev.target.classList.contains("header")) return;
    
    let id = ev.target.tagName == "SPAN" ? ev.target.parentElement.id : ev.target.id;
    let newSelected = graphs.get(parseInt(id.slice(1)));
    newSelected.focus();
})

headerArea.addEventListener("dblclick", (ev) => {
    
    if (ev.target.tagName!=="SPAN") return;

    ev.target.setAttribute("contenteditable", true);
    ev.target.focus();
    
})


shuffleArray(colors);
let colorIndex = 1;


function createTabUI(id) {
    tab_template.id = "g" + id;
    header_template.id = "h" + id;
    let newTab=tabArea.appendChild(tab_template.cloneNode(true));
    let newHeader = headerArea.insertBefore(header_template.cloneNode(true), newGraphButton);
    contentEdit(newHeader.querySelector(".text"),{maxSize: 16});
    
    //selectedHeader.style.backgroundColor = colors[colorIndex];
    let gradient = `linear-gradient(45deg,${colors[colorIndex - 1]},${colors[colorIndex]})`;
    colorIndex++;
    newHeader.style.cssText +=`background: ${gradient};`;

    headerArea.style.cssText += `border-image: ${gradient} 1`;
    if (colorIndex >= colors.length) {
        shuffleArray(colors);
        colorIndex = 1;
    }

    newHeader.querySelector(".text").textContent = "New graph " + id;
}