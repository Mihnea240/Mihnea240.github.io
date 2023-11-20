const colors = [
    "blueviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen",
    "darkslategray", "darkmagenta", "cornflowerblue", "crimson", "chocolate",
    "slateblue", "pink", "mediumseagreen","slategrey"
];
const newGraphButton = document.querySelector(".new-graph");
const tabArea = document.querySelector(".tab-area");
const headerArea = document.querySelector(".header");
const tab_template = elementFromHtml(`<graph-tab class="tab"></graph-tab>`);
const header_template = elementFromHtml(`<button class="graph-header selected"><span></span></button>`);
const action_menu = document.querySelector(".action-menu");

newGraphButton.addEventListener("click", (ev) => {
    createGraph();
    ev.stopImmediatePropagation(); ev.stopPropagation();
})

headerArea.addEventListener("click", (ev) => {
    if (!ev.target.classList.contains("graph-header")) return;
    
    let newSelected = graphs.get(parseInt(ev.target.id.slice(1)));
    newSelected.focus();
})

headerArea.addEventListener("dblclick", (ev) => {
    console.log(ev.target);
    if (ev.target.tagName!=="SPAN") return;

    ev.target.setAttribute("contenteditable", true);
    
})


shuffleArray(colors);
let colorIndex = 1;


function createTabUI(id) {
    tab_template.id = "g" + id;
    header_template.id = "h" + id;
    let newTab=tabArea.appendChild(tab_template.cloneNode(true));
    let newHeader = headerArea.insertBefore(header_template.cloneNode(true), newGraphButton);
    
    //selectedHeader.style.backgroundColor = colors[colorIndex];
    let gradient = `linear-gradient(45deg,${colors[colorIndex - 1]},${colors[colorIndex]})`;
    colorIndex++;
    newHeader.style.cssText +=`background: ${gradient};`;

    headerArea.style.cssText += `border-image: ${gradient} 1`;
    if (colorIndex >= colors.length) {
        shuffleArray(colors);
        colorIndex = 1;
    }

    newHeader.querySelector("span").textContent = "New graph " + id;
}




document.addEventListener("click", (ev) => {
    if (action_menu.open && !action_menu.contains(ev.target)) {
        action_menu.close();
    }
})