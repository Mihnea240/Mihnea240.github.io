const colors = [
    "blueviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen"
    , "darkmagenta", "cornflowerblue", "crimson", "chocolate",
    "slateblue", "pink", "mediumseagreen"
];
const newGraphButton = document.querySelector(".new-graph");
const tabArea = document.querySelector(".tab-area");
const headerArea = document.querySelector(".header");
const menuBar = document.querySelector(".menu-bar");
const tab_template = elementFromHtml(`<graph-tab></graph-tab>`);
const header_template = elementFromHtml(`
    <text-input spellcheck="false"></text-input>
`);
const inspector = document.getElementById("inspector");
const graphDialog = document.querySelector("graph-menu");


headerArea.addEventListener("mousedown", (ev) => {
    if (ev.target.matches(".new-graph")) {
        ev.stopImmediatePropagation(); ev.stopPropagation();
        newGraphDialog.showModal();
        return;
    }
    if (ev.target.matches(".header")) return;
    if (ev.detail != 2) {
        if(!ev.target.matches(":focus"))ev.preventDefault();
        Graph.get(parseInt(ev.target.id.slice(1)))?.focus();
    }
    
})


shuffleArray(colors);
let colorIndex = 1;

/**@param {Graph} graph */
function createTabUI(graph, settings) {
    tab_template.id = "g" + graph.id;
    header_template.id = "h" + graph.id;
    graph.tab=tabArea.appendChild(tab_template.cloneNode(true));
    graph.header = headerArea.insertBefore(header_template.cloneNode(true), newGraphButton);
    
    graph.settings.graph.name ||= "Graph " + graph.id;
    graph.settings.graph.main_color ||= standardize_color(colors[colorIndex - 1]);
    graph.settings.graph.secondary_color ||= standardize_color(colors[colorIndex++]);
    graph.tab.settings = graph.settings;
    graph.tab.zoom = graph.settings.graph.zoom;

    if (colorIndex >= colors.length) {
        shuffleArray(colors);
        colorIndex = 1;
    }
}

const greatMenus = {}
function initGreatMenus() {
    for (let button of menuBar.querySelectorAll(":scope > button")) {
        button.addEventListener("click", (ev) => {
            let rect = button.getBoundingClientRect();
            menuBar.querySelector(`[name=${button.getAttribute("for")}]`).toggle(rect.x, rect.bottom);
        })
    }

    greatMenus.viewMenu = elementFromHtml("<pop-menu name='view'></pop-menu>");
    greatMenus.viewMenu.appendChild(CustomInputs.category("", defaultSettingsTemplate));
    greatMenus.viewMenu.set = function (chain, value) { this.querySelector(".category").set(chain, value) }

    menuBar.appendChild(greatMenus.viewMenu);

    greatMenus.viewMenu.querySelector(".category").addEventListener("input", function (ev) {
        let g = Graph.selected;
        let top = g.actionsStack.top();
        let chain = CustomInputs.getChainFromEvent(this, ev);

        let value = g.setSettings(chain, ev.target.parentElement.get());
        console.log(value);

        if (top?.acumulate) top.newValue = ev.target.parentElement.get();
        else {
            let c = Graph.selected.actionsStack.push(new SettingsChangedCommand(chain, value));
            c.acumulate = true;
        }
    })

    greatMenus.viewMenu.querySelector(".category").addEventListener("change", function (ev) {
        let top = Graph.selected.actionsStack.top();
        if(top)top.acumulate = false;
    })
    

    greatMenus.fileMenu = menuBar.querySelector("pop-menu[name='file']");

    greatMenus.actionMenu = elementFromHtml("<pop-menu></pop-menu>");
    greatMenus.actionMenu.appendChild(CustomInputs.category("Actions", actionMenuTemplate));
    document.body.appendChild(greatMenus.actionMenu);
}

function openActionMenu(ev,graph) {

    if (ev.button != 2) return;
    if (greatMenus.actionMenu.open) return greatMenus.actionMenu.close();
    
    greatMenus.actionMenu.show(ev.clientX+5, ev.clientY+5);
    greatMenus.actionMenu.querySelector(".category").validate(ev);
}
