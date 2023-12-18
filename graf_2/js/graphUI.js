const colors = [
    "blueviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen"
    , "darkmagenta", "cornflowerblue", "crimson", "chocolate",
    "slateblue", "pink", "mediumseagreen"
];
const newGraphButton = document.querySelector(".new-graph");
const tabArea = document.querySelector(".tab-area");
const headerArea = document.querySelector(".header");
const menuBar = document.querySelector(".menu-bar");
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

/**@param {Graph} graph */
function createTabUI(graph) {
    tab_template.id = "g" + graph.id;
    header_template.id = "h" + graph.id;
    graph.tab=tabArea.appendChild(tab_template.cloneNode(true));
    graph.header = headerArea.insertBefore(header_template.cloneNode(true), newGraphButton);

    contentEdit(graph.header.querySelector(".text"), { maxSize: parseInt(defaultSettingsTemplate.graph.name.maxLength) });
    
    graph.loadSettings();
    graph.settings.graph.name ||= "New graph " + graph.id;
    graph.settings.graph.main_color = standardize_color(colors[colorIndex - 1]);
    graph.settings.graph.secondary_color = standardize_color(colors[colorIndex++]);
    graph.tab.settings = graph.settings;
    graph.tab.zoom = graph.settings.graph.zoom;

    if (colorIndex >= colors.length) {
        shuffleArray(colors);
        colorIndex = 1;
    }
}

const greatMenus = {}
function initGreatMenus() {
    for (let button of menuBar.querySelectorAll("button")) {
        button.addEventListener("click", (ev) => {
            ev.stopPropagation();
            let rect = button.getBoundingClientRect();
            menuBar.querySelector(`[name=${button.getAttribute("for")}]`).toggle(rect.x, rect.bottom);
        })
    }
    greatMenus.viewMenu = createOptionsMenu(defaultSettingsTemplate,"view");
    menuBar.appendChild(greatMenus.viewMenu);

    greatMenus.viewMenu.addEventListener("propertychanged", (ev) => {
        let { category, property, originalTarget } = ev.detail;
        graphs.selected.settings[category][property] = originalTarget.value;
    });
}

