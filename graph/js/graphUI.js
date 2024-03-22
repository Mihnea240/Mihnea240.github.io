const colors = [
    "blueviolet", "brown", "lightsalmon", "indigo", "aquamarine", "lightseagreen"
    , "darkmagenta", "cornflowerblue", "crimson", "chocolate",
    "slateblue", "pink", "mediumseagreen"
];
const newGraphButton = document.querySelector(".new-graph");
const tabArea = document.getElementById("main");
const headerArea = tabArea.querySelector(".header");
const menuBar = document.querySelector(".menu-bar");
const tab_template = elementFromHtml(`<graph-tab></graph-tab>`);
const header_template = elementFromHtml(`
    <text-input spellcheck="false" class="graph-header" maxLength="32"></text-input>
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
        if (!ev.target.matches(":focus")) ev.preventDefault();
        Graph.get(parseInt(ev.target.id.slice(1)))?.focus();
    }
});
headerArea.addEventListener("change", (ev) => {
    let id = ev.target.id;
    if (id[0] == "h") {
        let g = Graph.get(parseInt(id.slice(1)));
        g.setSettings(["name", "graph"], ev.target.value);
    }
})


shuffleArray(colors);
let colorIndex = 1;

/**@param {Graph} graph */
function createTabUI(graph) {
    tab_template.id = "g" + graph.id;
    header_template.id = "h" + graph.id;
    graph.tab=tabArea.querySelector(".tabs").appendChild(tab_template.cloneNode(true));
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

const greatMenus = {
    initViewMenu() {
        this.viewMenu = elementFromHtml("<pop-menu name='view'></pop-menu>");
        this.viewMenu.appendChild(CustomInputs.category("", defaultSettingsTemplate));
        this.viewMenu.set = function (chain, value) { this.querySelector(".category").set(chain, value) }
    
        menuBar.appendChild(this.viewMenu);
    
        this.viewMenu.querySelector(".category").addEventListener("input", function (ev) {
            let g = Graph.selected;
            let top = g.actionsStack.top();
            let chain = CustomInputs.getChainFromEvent(this, ev);
    
            let value = g.setSettings(chain, ev.target.parentElement.get());
    
            if (top?.acumulate) top.newValue = ev.target.parentElement.get();
            else {
                let c = Graph.selected.actionsStack.push(new SettingsChangedCommand(chain, value));
                c.acumulate = true;
            }
        })
    
        this.viewMenu.querySelector(".category").addEventListener("change", function (ev) {
            let top = Graph.selected.actionsStack.top();
            if(top)top.acumulate = false;
        })
    },
    initFileDialog() {
        this.fileMenu = menuBar.querySelector("pop-menu[name='file']");
        this.fileDialog = document.getElementById("file-dialog");
    
        let list = this.fileDialog.querySelector("list-view");
        list.template = function(graph){
            return elementFromHtml(`<label><input data-id=${graph.id} checked type="checkbox">${graph.settings.graph.name}</label>`);
        }
        this.fileDialog.querySelector("input").addEventListener("change", function () {
            this.fileDialog.querySelectorAll("list-view input").forEach((el) => el.checked = this.checked);
        })
        
        this.fileDialog.querySelector("button").addEventListener("click", function () {
            let anchor = this.fileDialog.querySelector("a"), array = [];
    
            greatMenus.fileDialog.querySelectorAll("list-view input:checked")
                .forEach(el => array.push(Graph.get(parseInt(el.getAttribute("data-id"))).toJSON()))
    
            if (array.length) {
                try {
                    const blobURL = createFile(array);
                    anchor.setAttribute("href", blobURL);    anchor.click();
                    setTimeout(() => { URL.revokeObjectURL(blobURL); anchor.href=""}, 1000);
                } catch (e) { console.log(e) }
            }
            this.fileDialog.close();
        })
    },
    initForceMenu() {
        this.forceMenu = elementFromHtml("<pop-menu name='physics'></pop-menu>");
        this.forceMenu.appendChild(CustomInputs.category("", physicsTemplate));
        menuBar.appendChild(this.forceMenu);
        this.forceMenu.addEventListener("input", function(ev){
            let chain = CustomInputs.getChainFromEvent(this, ev);
            let value = ev.target.parentElement.get();
            
            switch (chain[0]) {
                case "spring": physicsMode.spring = value / 100; break;
                case "isRunning":break;
                case "frameRate": appData.physicsSettings.frameRate = value; break;
                case "interactions": if (physicsMode.isRunning()) physicsMode.stop(), ACTIONS.togglePhysicsSimulation();
                default: physicsMode[chain[0]] = value;
            }
        })
    },
    initActionMenu() {
        this.actionMenu = elementFromHtml("<pop-menu></pop-menu>");
        this.actionMenu.appendChild(CustomInputs.category("", actionMenuTemplate));
        document.body.appendChild(this.actionMenu);
        document.body.addEventListener("mouseup", (ev) => {
            if (ev.button == 2) openActionMenu(ev);
        })
    
    },
    initTemplateMenu() {
        this.templateMenu = document.getElementById("template");
        let tabs=this.template
    
        this.templateMenu.querySelector(".tabs [name='graph']").appendChild(CustomInputs.category("Details", graphTemplate));
        this.templateMenu.querySelector(".tabs [name='node']").appendChild(CustomInputs.category("Details", nodeTemplate));
        this.templateMenu.querySelector(".tabs [name='edge']").appendChild(CustomInputs.category("Details", edgeTemplate));
    
    },
    init() {
        for (let button of menuBar.querySelectorAll(":scope > button")) {
            button.addEventListener("click", (ev) => {
                let rect = button.getBoundingClientRect();
                menuBar.querySelector(`[name=${button.getAttribute("for")}]`).toggle(rect.x, rect.bottom);
            })
        }
        this.initViewMenu();
        this.initFileDialog();
        this.initForceMenu();
        this.initActionMenu();
        this.initTemplateMenu();
        
    }
}

function openActionMenu(ev, graph) {
    
    if (!ev.target.matches("graph-tab, .graph-header") || ev.button != 2) return;

    if (greatMenus.actionMenu.open) return greatMenus.actionMenu.close();
    
    greatMenus.actionMenu.show(ev.clientX+5, ev.clientY+5);
    greatMenus.actionMenu.querySelector(".category").validate(ev);
}
