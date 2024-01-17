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
            update(graph) {
                let name = graph.settings.graph.name;
                graph.header.value = name;
            }
        },
        main_color: {
            type: "color",
            property: "--graph-main-color",
            update(graph) {
                let a = `linear-gradient(45deg,${graph.settings.graph.main_color},${graph.settings.graph.secondary_color})`;
                graph.header.style.background = a
                headerArea.style.borderImage = a + " 1";
            }
        },
        secondary_color: {
            type: "color",
            property: "--graph-secondary-color",
            update(graph) {
                let a = `linear-gradient(45deg,${graph.settings.graph.main_color},${graph.settings.graph.secondary_color})`;
                graph.header.style.background = a
                headerArea.style.borderImage = a + " 1";
            }
        },
        show_ruller: {
            type: "checkbox",
            update(graph) {
                let value = graph.settings.graph.show_ruller==="true" ? "visible" : "none";
                console.log(graph.settings.graph.show_ruller);
                graph.tab.style.setProperty("--show-ruller", value);
            }
        },
        zoom: {
            type: "range",
            min: "0.1", max: "3", step: "0.1",
            unit: "none",
            property: "--zoom"
        }

    },
    node: {
        size: {
            type: "range",
            max: "60",
            property: "--node-width"
        },
        bg: {
            type: "color",
            property: "--node-background",
            display: "Background",
        },
        color: {
            type: "color",
            property: "--node-color",
            display: "Font color"
        },
        border_color: {
            type: "color",
            property: "--node-border-color"
        },
        border_radius: {
            type: "range",
            max: "50", unit: "%",
            property: "--node-border-radius"
        },
        border_width: {
            type: "range",
            max: "6", step: "0.1",
            property: "--node-border-width"
        },
        border_style: {
            type: "select",
            options: ["solid", "dashed", "double"],
            property: "--node-border-style"
        },
        emission: {
            value: "10",
            type: "range",
            max: "20",
            property: "--node-emission"
        }
    },
    edge: {
        width: {
            type: "range",
            max: "5", step: "0.1",
            property: "--edge-width"
        },
        emission: {
            type: "range",
            max: "10",
            property: "--edge-emission"
        },
        color: {
            type: "color",
            property: "--edge-color",

        },
        cp_symmetry: {
            type: "checkbox",
            display: "Control point symmetry",
            update(graph) {
                graph.tab.forEdges((edge) => edge.setAttribute("symmetry", graph.settings.edge.cp_symmetry))
            }
        },
        mode: {
            type: "select",
            options: ["absolute", "relative"],
            description: "Controls the motion of the control points when moving a node",
            update(graph) {
                graph.tab.forEdges((edge) => {
                    edge.setAttribute("mode", graph.settings.edge.mode);
                })
            }
        },
    }
}