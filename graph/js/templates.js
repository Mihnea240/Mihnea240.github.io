const defaultGraphJSON = {
    settings: {
        graph: {
            name: "",
            main_color: "",
            secondary_color: "",
            show_ruller: "false",
            zoom: 1,
        },
        node: {
            size: "25",
            bg: "#242424",
            color: "#ffffff",
            border_radius: "50",
            border_width: "1",
            border_style: "solid",
            border_color: "#ffffff",
            emission: "10",
        },
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
    data: {
        nodes: [1],
        connections: {},
        nodeProps: {},
        edgeProps: {}
    },
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
    node: {
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
            max: "20",
            _property: "--node-emission"
        }
    },
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

const actionMenuTemplate = {
    categoryCollapse: false,
    "Graph actions": {
        _condition(ev){return ev.target.matches(".graph-header")},
        rename: {
            type: "button",
            title: "Double click header",
            onclick(ev) {
                Graph.selected?.header.querySelector("text-input").focus();
                actionMenu.close();
            }
        },
        delete: {
            type: "button",
            onclick(ev) { Graph.selected?.delete(); actionMenu.close(); }
        },
        copy: {
            type: "button",
            onclick(ev) { createGraph(Graph.selected.dataTemplate()); actionMenu.close(); }
        }
    },
    "Node actions": {
        delete: {
            type: "button",
            onclick(ev) { Graph.selected.selection.deleteNodes(); actionMenu.close() },
            _condition() { return Graph.selected.selection.nodeSet.size > 0; },
            title: "Delets all selected nodes (DEL)"
        },
        add: {
            type: "button",
            onclick() { Graph.selected.addNode() },
            title: "Ads a new node. Press + to add a node to cursor position"
        },
        disconnect: {
            type: "button",
            onclick() {
                let g = Graph.selected;
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
            _condition() { return Graph.selected.selection.nodeSet.size > 0; },
            title: "Delets all edges connected to the selected nodes"
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
            _condition() { return Graph.selected.selection.nodeSet.size > 1; },
            title: "Ads all posible edges between the selected nodes \n If the graph is ordered by holding (ctrl) the direction of the edge will be randomised",
        }

    },
    "Edge actions": {
        delete: {
            type: "button",
            onclick() { Graph.selected.selection.deleteEdges(); actionMenu.close() },
            _condition() { return Graph.selected.selection.edgeSet.size > 0; },
            title: "Delets all selected edges"
        },
        add: {
            type: "button",
            onclick(ev) {
                actionMenu.close();
            }
        }
    }
}