const defaultGraphJSON = {
    type: 0,
    template: "default",
    data:{},
    nodeProps: [{nodeId: 1}],
    edgeProps: [],
}

const defaultTemplateStyls = {
    node:/*css */`
        :host{
            position: absolute;
            background-color: inherit;
            color: #ffffff;
            border-radius: 10px;
            border: 1px solid #ffffff;
            min-width: 25px; min-height: 25px;
            z-index: 100;
        }
        :host([template="default"]){
            display: flex;
            justify-content: center;
            align-items: center;
            --node-emmision: 10px;
        }
        .description{
            margin: .2rem .4rem;
        }
        .description:focus{
            outline: none;
        }
        :host(.selected){
            box-shadow:
                0 0 var(--node-emission) var(--graph-main-color),
                0 0 calc(var(--node-emission) *0.9) var(--graph-main-color) inset;
        }
    `.trim(),
    edge:  /*css */`
        :host{
            position: absolute;
            pointer-events: stroke;
        }

        :host(.selected) {
            filter:
                drop-shadow(0 0 var(--edge-emission) var(--graph-main-color)) drop-shadow(0 0 calc(var(--edge-emission)* .2) var(--graph-main-color)) drop-shadow(0 0 calc(var(--edge-emission)* .1) var(--graph-main-color));
        }

        :host(::part(arrow)) {
            position: absolute;
            fill: white;
            translate: -50% -50%;
            width: calc(15 * var(--edge-width));
            aspect-ratio: 1;
        }
    `.trim(),
    graph: /*css */`
        :host{
            position: relative;
            width: 100%;  height:100%;
            background: transparant;
            z-index: -1;
        }
        #square{
            position: absolute;
            width: 100%;  height:100%;
            background-color: transparent;
            pointer-events:none;
            user-select: none;
        }
        .tab{
            position: absolute;
            overflow: scroll;
            width: 100%;  height:100%;
            background: inherit;
            z-index: -2;
        }
        ::-webkit-scrollbar{
            background-color: inherit;
            width: 8px;    height: 8px;
            z-index: 5;
        }
        ::-webkit-scrollbar-corner{

        }
        ::-webkit-scrollbar-thumb{
            background-color: rgba(0, 0, 0, 0.47);
            border-radius: .2em;
        }
        .hide{display: none}
        list-view{
            position: absolute;
            z-index: 10;
            & >*{
                font-size: .5rem;
                opacity: 0.8;
                text-shadow: rgba(255, 255, 255, 0.932) 0px 0px 2px;
            }
        }

        list-view[direction="row"]{
            width: 100%;
            bottom: 0; left: 0;
            & >*{
                min-width: 100px;
                text-align: left;
                border-bottom: 1px solid white;
            }
        }
        list-view[direction="column"]{
            height: 100%;
            right: 0; top: 0;
            & >*{
                border-right: 1px solid white;
                min-height: 100px;
            }
        }
        #selectionRect{
            position: absolute;
            display: none;
            background-color: var(--ui-select);
            opacity: 0.6;
            z-index: 304;
        }
    `
}

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
            onclick(ev) { createGraph(Graph.selected.toJSON()); greatMenus.actionMenu.close(); }
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

const InspectorTemplates = {
    graph: {
        categoryCollapse: false,
        id: {
            type: "text",
            readonly: true,
        },
        name: {
            type: "text",
            maxLength: 32,
        },
        type: {
            type: "text",
            readonly: true,
        },
        nodeCount: {
            type: "text",
            display:"Node count",
            readonly: true,
        },
        edgeCount: {
            type: "text",
            display:"Edge count",
            readonly: true,
        },
        conex: {
            type: "text",
            display:"Conex components",
            readonly: true,
        },
    },
    edge: {
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
    },
    node: {
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
}

const TemplateMenuTemplates = {
    graph: {
        categoryCollapse: false,
        name: {
            type: "text",
            maxLength: 32,
        },
        main_color: {
            type: "color",
        },
        secondary_color: {
            type: "color",
        },
        show_ruller: {
            type: "checkbox",
        },
        zoom: {
            type: "range",
            min: "0.1", max: "3", step: "0.1",
        },
        node_template: {
            type: "select",
            options: ["default"],
        },
        edge_template: {
            type: "select",
            options: ["default"]
        }
    },
    node: {
        categoryCollapse: false,
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
    },
    edge: {
        categoryCollapse: false,
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
}

