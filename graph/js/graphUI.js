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
const inspector = document.getElementById("inspector");
const graphDialog = document.querySelector("graph-menu");


headerArea.addEventListener("click", (ev) => {
    if (ev.target.classList.contains("new-graph")) {
        ev.stopImmediatePropagation(); ev.stopPropagation();
        newGraphDialog.showModal();
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
headerArea.addEventListener("focusout", (ev) => {
    if (ev.target.tagName == "SPAN") {
        let G = graphs.get(parseInt(ev.target.parentElement.id.slice(1)));
        G.settings.graph.name = ev.target.textContent;
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

    contentEdit(graph.header.querySelector(".text"), { maxSize: parseInt(defaultSettingsTemplate.graph.name.maxLength) });
    
    graph.loadSettings(settings);
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


    menuBar.appendChild(greatMenus.viewMenu = createOptionsMenu(defaultSettingsTemplate, "view"));

    greatMenus.viewMenu.addEventListener("propertychanged", (ev) => {
        let { category, property, originalTarget } = ev.detail;
        let top = graphs.selected.settingsStack.top();
        
        if (top?.acumulate) top.newValue = originalTarget.value;
        else {
            let c = graphs.selected.settingsStack.push(new SettingsChangedCommand(category, property, graphs.selected.settings[category][property]));
            c.acumulate = true;
        }
        graphs.selected.settings[category][property] = originalTarget.value;
    });

    greatMenus.viewMenu.addEventListener("change", (ev) => {
        let top = graphs.selected.settingsStack.top();
        if(top)top.acumulate = false;
    })
    

    greatMenus.fileMenu = menuBar.querySelector("pop-menu[name='file']");
}


const actionMenuTemplate = {
    "Graph actions": {
        rename: {
            type: "button",
            description: "Double click header",
            onclick(ev) {
                let h = actionMenu.activeGraph?.header.querySelector("span");
                h.setAttribute("contenteditable", true);
                h.focus();
                actionMenu.close();
            }
        },
        delete: {
            type: "button",
            onclick(ev) { actionMenu.activeGraph?.delete(); actionMenu.close(); }
        },
        copy: {
            type: "button",
            onclick(ev) { createGraph(actionMenu.activeGraph.dataTemplate()); actionMenu.close(); }
        }
    },
    "Node actions": {
        delete: {
            type: "button",
            onclick(ev) { actionMenu.activeGraph.selection.deleteNodes(); actionMenu.close() },
            condition() { return actionMenu.activeGraph.selection.nodeSet.size > 0; },
            description: "Delets all selected nodes (DEL)"
        },
        add: {
            type: "button",
            onclick() { actionMenu.activeGraph.addNode() },
            description: "Ads a new node. Press + to add a node to cursor position"
        },
        disconnect: {
            type: "button",
            onclick() {
                let g = actionMenu.activeGraph;
                g.actionsStack.startGroup();
                for (let n of g.selection.nodeSet) {
                    for (let adjacent of g.adjacentNodes(n.nodeId)) {
                        if (adjacent < 0) continue;
                        g.removeEdge(n.nodeId, adjacent);
                    }
                }
                g.actionsStack.endGroup();
                actionMenu.close();
            },
            condition() { return actionMenu.activeGraph.selection.nodeSet.size > 0; },
            description: "Delets all edges connected to the selected nodes"
        },
        complete: {
            type: "button",
            onclick(ev) {
                let g = actionMenu.activeGraph;
                let array = Array.from(g.selection.nodeSet).map(el => el.nodeId);
                g.actionsStack.startGroup();
                for (let i of array) {
                    for (let j of array) {
                        if (g.type == ORDERED) {
                            if (ev.ctrlKey) {
                                if (i<j) continue;
                                if (Math.random() < 0.5) g.addEdge(j, i);
                                else g.addEdge(i, j);
                                continue;
                            }
                            g.addEdge(j, i);
                            g.addEdge(i, j);                           
                        }else g.addEdge(i, j);
                    }
                }
                g.actionsStack.endGroup();
                actionMenu.close();
            },
            condition() { return actionMenu.activeGraph.selection.nodeSet.size > 1; },
            description: "Ads all posible edges between the selected nodes \n If the graph is ordered by holding (ctrl) the direction of the edge will be randomised",
        }

    },
    "Edge actions": {
        delete: {
            type: "button",
            onclick() { actionMenu.activeGraph.selection.deleteEdges(); actionMenu.close() },
            condition() { return actionMenu.activeGraph.selection.edgeSet.size > 0; },
            description: "Delets all selected edges"
        },
        add: {
            type: "button",
            onclick(ev) {
        
                actionMenu.close();
            }
        }
    }
}
const actionMenu = document.body.appendChild(createOptionsMenu(actionMenuTemplate, "actions", false));
document.addEventListener("mouseup", (ev) => {
    openActionMenu(ev);
})

function openActionMenu(ev) {

    if (ev.button != 2) return;
    if (actionMenu.open) return actionMenu.close();
    let id, graphActions = false;
    
    if (ev.target.matches("[id^='h'],[id^='h'] span")) {
        id = parseInt(ev.target.parentElement.id.slice(1));
        graphActions = true;
    } else if (ev.target.matches("graph-tab")) {
       
        
    } else if (ev.target.matches("graph-node")) {
        id = ev.target.graphId;
        
    } else if (ev.target.matches("graph-edge")) {
        
        id = ev.target.graphId;
    } else return;
    
    actionMenu.activeGraph = graphs.get(id);
    actionMenu.querySelectorAll(".category").forEach(el => el.classList.remove("hide"));
    actionMenu.show(ev.clientX+5, ev.clientY+5);
    if (graphActions) {
        actionMenu.querySelector(".category[name='Node actions']").classList.add("hide");
        actionMenu.querySelector(".category[name='Edge actions']").classList.add("hide");
    } else actionMenu.querySelector(".category[name='Graph actions']").classList.add("hide");
    
    actionMenu.validate();
    
    document.body.click();
}
