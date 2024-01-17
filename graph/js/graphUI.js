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
        graphs.get(parseInt(ev.target.id.slice(1)))?.focus();
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
        let top = graphs.selected.actionsStack.top();
        let chain = CustomInputs.getChainFromEvent(this, ev);

        let value = graphs.selected.setSettings(chain, ev.target.parentElement.get());
        if (top?.acumulate) top.newValue = ev.target.parentElement.get();
        else {
            let c = graphs.selected.actionsStack.push(new SettingsChangedCommand(chain, value));
            c.acumulate = true;
        }
    })

    greatMenus.viewMenu.querySelector(".category").addEventListener("change", function (ev) {
        let top = graphs.selected.actionsStack.top();
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
/*const actionMenu = document.body.appendChild(createOptionsMenu(actionMenuTemplate, "actions", false));
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
    } else if (ev.target.matches("graph-tab,graph-node,graph-edge")) id = ev.target.graphId;
    else return;
    
    actionMenu.activeGraph = graphs.get(id);
    actionMenu.querySelectorAll(".category").forEach(el => el.classList.remove("hide"));
    actionMenu.show(ev.clientX+5, ev.clientY+5);
    if (graphActions) {
        actionMenu.querySelector(".category[name='Node actions']").classList.add("hide");
        actionMenu.querySelector(".category[name='Edge actions']").classList.add("hide");
    } else actionMenu.querySelector(".category[name='Graph actions']").classList.add("hide");
    
    actionMenu.validate();
    
    document.body.click();
}*/
