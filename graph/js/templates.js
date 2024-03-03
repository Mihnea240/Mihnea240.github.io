const defaultGraphJSON = {
    settings: {
        graph: {
            name: "",
            main_color: "",
            secondary_color: "",
            show_ruller: "false",
            zoom: 1,
        },
       /*  node: {
            size: "25",
            bg: "#242424",
            color: "#ffffff",
            border_radius: "50",
            border_width: "1",
            border_style: "solid",
            border_color: "#ffffff",
            emission: "10",
        }, */
        edge: {
            width: "1",
            emission: "3",
            color: "#ffffff",
            cp_symmetry: true,
            mode: "absolute",
            min_drag_dist: 5,
            cp_offset: [0, 0],
        }
    },
    type: ORDERED,
    nodeProps: [{nodeId: 1}],
    edgeProps: [],
}

const defaultSettingsTemplate = {
    categoryCollapse: false,
    graph: {
        name: {
            type: "text",
            maxLength: 32,
            _update(graph) {
                let name = graph.settings.graph.name;
                graph.header.value = name;
            }
        },
        main_color: {
            type: "color",
            _property: "--graph-main-color",
            _update(graph) {
                let a = `linear-gradient(45deg,${graph.settings.graph.main_color},${graph.settings.graph.secondary_color})`;
                graph.header.style.background = a
                headerArea.style.borderImage = a + " 1";
            }
        },
        secondary_color: {
            type: "color",
            _property: "--graph-secondary-color",
            _update(graph) {
                let a = `linear-gradient(45deg,${graph.settings.graph.main_color},${graph.settings.graph.secondary_color})`;
                graph.header.style.background = a
                headerArea.style.borderImage = a + " 1";
            }
        },
        show_ruller: {
            type: "checkbox",
            _update(graph) {
                graph.tab.style.setProperty("--show-ruller", graph.settings.graph.show_ruller ? "visible" : "none");
            }
        },
        zoom: {
            type: "range",
            min: "0.1", max: "3", step: "0.1",
            _property: "--zoom"
        }

    },
   /*  node: {
        size: {
            type: "range",
            max: "60", _unit: "px",
            _property: "--node-width"
        },
        bg: {
            type: "color",
            _property: "--node-background",
            _display: "Background",
        },
        color: {
            type: "color",
            _property: "--node-color",
            _display: "Font color"
        },
        border_color: {
            type: "color",
            _property: "--node-border-color"
        },
        border_radius: {
            type: "range",
            max: "50", _unit: "%",
            _property: "--node-border-radius"
        },
        border_width: {
            type: "range",
            max: "6", step: "0.1",
            _unit: "px",
            _property: "--node-border-width"
        },
        border_style: {
            type: "select",
            options: ["solid", "dashed", "double"],
            _property: "--node-border-style"
        },
        emission: {
            value: "10",
            type: "range",
            max: "20", _unit: "px",
            _property: "--node-emission"
        }
    }, */
    edge: {
        width: {
            type: "range",
            max: "5", step: "0.1",
            _unit: "px",
            _property: "--edge-width"
        },
        emission: {
            type: "range",
            max: "10", _unit: "px",
            _property: "--edge-emission"
        },
        color: {
            type: "color",
            _property: "--edge-color",
        },
        cp_symmetry: {
            type: "checkbox",
            _display: "Control point symmetry",
            _update(graph) {
                graph.tab.forEdges((edge) => edge.setAttribute("symmetry", graph.settings.edge.cp_symmetry))
            }
        },
        mode: {
            type: "select",
            options: ["absolute", "relative"],
            title: "Controls the motion of the control points when moving a node",
            _update(graph) {
                graph.tab.forEdges((edge) => {
                    edge.setAttribute("mode", graph.settings.edge.mode);
                })
            }
        },
    }
}

const nodeDefaultTemplate = `
    background-color: #242424;
    color: #ffffff;
    border-radius: 100px;
    border-width: 1px;
    border-style: solid;
    border-color: #ffffff;
`.trim();

const edgeDefaultTemplate = `
    width: 1px;
    background-color: #ffffff;
    --emmision: 10px;
`

const actionMenuTemplate = {
    categoryCollapse: false,
    "Graph actions": {
        categoryCollapse: false,
        condition(ev){return ev.target.matches(".graph-header")},
        rename: {
            type: "button",
            title: "Double click header",
            onclick(ev) {
                Graph.selected?.header.focus();
                greatMenus.actionMenu.close();
            }
        },
        delete: {
            type: "button",
            onclick(ev) { Graph.selected?.delete(); greatMenus.actionMenu.close(); }
        },
        copy: {
            type: "button",
            onclick(ev) { createGraph(Graph.selected.dataTemplate()); greatMenus.actionMenu.close(); }
        }
    },
    "Selection actions": {
        categoryCollapse: false,
        condition(ev){return ev.target.matches("graph-tab")},
        "Delete Nodes": {
            type: "button",
            onclick(ev) { Graph.selected.selection.deleteNodes(); greatMenus.actionMenu.close(); },
            condition() { return Graph.selected.selection.nodeSet.size > 0; },
            title: "Delets all selected nodes (DEL)"
        },
        "Add Node": {
            type: "button",
            onclick() { Graph.selected.addNode(); greatMenus.actionMenu.close(); },
            title: "Ads a new node. Press + to add a node to cursor position"
        },
        Disconnect: {
            type: "button",
            onclick(ev) {
                let g = Graph.selected;
                g.actionsStack.startGroup();
                for (let n of g.selection.nodeSet) {
                    for (let adjacent of g.adjacentNodes(n.nodeId)) {
                        if (adjacent < 0) {
                            if (!ev.ctrlKey) g.removeEdge(-adjacent, n.nodeId);
                            else continue;
                        }
                        g.removeEdge(n.nodeId,adjacent);
                    }
                }
                g.actionsStack.endGroup();
                greatMenus.actionMenu.close();
            },
            condition() { return Graph.selected.selection.nodeSet.size > 0; },
            title: "Delets all edges connected to the selected nodes /n Hold Ctrl to only delete "
        },
        complete: {
            type: "button",
            onclick(ev) {
                let g = Graph.selected;
                let array = Array.from(g.selection.nodeSet).map(el => el.nodeId);
                g.actionsStack.startGroup();
                for (let i of array) {
                    for (let j of array) {
                        if (g.type == ORDERED) {
                            if (ev.ctrlKey) {
                                if (i<j) continue;
                                if (Math.random() < 0.5) g.addEdge({from: j, to: i});
                                else g.addEdge({from: i, to: j });
                                continue;
                            }
                            g.addEdge({from: j, to: i });
                            g.addEdge({ from: i, to: j });                           
                        } else g.addEdge({from: i, to: j });
                    }
                }
                g.actionsStack.endGroup();
                greatMenus.actionMenu.close();
                
            },
            condition() { return Graph.selected.selection.nodeSet.size > 1; },
            title: "Ads all posible edges between the selected nodes \n If the graph is ordered by holding (ctrl) the direction of the edge will be randomised",
        },

        delete: {
            type: "button",
            onclick() { Graph.selected.selection.deleteEdges(); greatMenus.actionMenu.close(); },
            condition() { return Graph.selected.selection.edgeSet.size > 0; },
            title: "Delets all selected edges"
        },
        add: {
            type: "button",
            onclick(ev) {
                greatMenus.actionMenu.close(); 
            }
        }
    }
}


const physicsTemplate = {
    categoryCollapse: false,
    isRunning: {
        type: "button",
        onclick() { ACTIONS.togglePhysicsSimulation(); },
        display: "Toggle",
        title: "Turns green when active (F)"
    },
    gravity: {
        _display:"Gravitational constant",
        type: "number",
        max: "999999999",
    },
    spring: {
        display: "Spring constant",
        type: "range",
        step:"0.1",
        max: "2"
    },
    "springIdealLength":{
        display: "Spring ideal length",
        type: "number",
        max: "1000",
    },
    energyLoss: {
        display: "Energy lost on collision",
        type: "range",
        max: "1", step: "0.1",
    },
    drag: {
        type: "range",
        value: "0",
        max: "1", step: "0.01",
        title: "Procentage of speed which is lost on each frame",
    },
    "interactions": {
        type: "select",
        options: ["All", "Between neighbours", "Between direct neighbours"],
        title: "Decides whitch nodes are effected by forces"
    },
    "reset": {
        type: "button",
        onclick() {
            for (let n of Graph.selected.tab.getNodeArray()) {
                n.transform.velocity.set(0, 0);
                n.transform.acceleration.set(0, 0);
            }
        },
        title: "Resets the velocity and acceleration of all nodes to 0"
    },
    frameRate: {
        display: "Frame rate",
        type: "number",
        max: "60",
    }
}

const nodeInspectorTemplate = {
    "": {
        display: "Node details",
        id: {
            type: "number",
            readonly: true,
        },
        template: {
            type: "text",
            readonly: true,
        },
        description: {
            type: "textarea",
        },
        isStatic: {
            type: "checkbox",
            display: "static",
            title: "Physics won't be applied to static nodes"
        },
        mass: {
            type: "number",
            max: 100000,
        },
        degree: {
            type: "number",
            readonly: "true",
            title: "Number of nodes connected to this node",
        },
        inner: {
            type: "number",
            readonly: "true",
            display: "Inner degree",
            condition() { return Graph.selected.type == ORDERED },
            title: "Number of nodes entering this node",
        },
        outer: {
            type: "number",
            readonly: "true",
            display: "Outer degree",
            condition() { return Graph.selected.type == ORDERED },
            title: "Number of nodes exiting this node",
        },
    },
    "Adjacent nodes": {
        
    },
    transform: {
        position: {
            categoryCollapse: false,
            tupel: true,
            x: {
                type: "number",
                decimal: "2",
            },
            y: {
                type: "number",
                decimal: "2",
            },
        },
        velocity: {
            categoryCollapse: false,
            tupel: true,
            x: {
                type: "number",
                decimal: "2",
            },
            y: {
                type: "number",
                decimal: "2",
            },
            
        },
        acceleration: {
            categoryCollapse: false,
            tupel: true,
            x: {
                type: "number",
                decimal: "2",
            },
            y: {
                type: "number",
                decimal: "2",
            },
        },
        size: {
            categoryCollapse: false,
            tupel: true,
            x: {
                type: "number",
                decimal: "0",
                readonly: true,
            },
            y: {
                type: "number",
                decimal: "0",
                readonly: true,
            },
        },
    }
}

const edgeInspectorTemplate = {
    from: {
        type: "text",
        readonly: true,
        onclick(ev) {
            let input = ev.target.closest("text-input");
            let id = parseInt(input.value);
            Graph.selected.getNodeUI(id).scrollIntoView();
        }
    },
    to: {
        type: "text",
        readonly: true,
        onclick(ev) {
            let input = ev.target.closest("text-input");
            let id = parseInt(input.value);
            Graph.selected.getNodeUI(id).scrollIntoView();
        }
    },
    symmetry: {
        type: "range",
        min: "-1", max: "1",
        title: "Regarding control points:\n -1: They move complementary to oneanother\n 0: They move independently\n 1: They move at the same rate"
    },
    mode: {
        type: "select",
        options: ["absolute", "relative"],
        title: "Relative mode moves both control points relative to the edge direction",
        
    },
    description: {
        type: "textarea",
    }
}

const graphInspectorTemplate = {
    categoryCollapse: false,
    id: {
        type: "text",
        readonly: true,
    },
    name: {
        type: "text",
        maxLength: 32,
    }
}
