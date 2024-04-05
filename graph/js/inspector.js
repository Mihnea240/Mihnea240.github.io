const InspectorTemplates = {
    graph: {
        categoryCollapse: true,
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
        "Conex parts": {},
    },
    edge: {
        from: {
            type: "text",
            readonly: true,
            class: "text-hover",
            onclick: UI.highlight,
        },
        to: {
            type: "text",
            readonly: true,
            class: "text-hover",
            onclick: UI.highlight,
        },
        symmetry: {
            type: "range",
            min: "-1", max: "1",
            title: "Regarding control points:\n -1: They move complementary to oneanother\n 0: They move independently\n 1: They move at the same rate",
            oninput(ev) { UI.inspector.observed.symmetry = ev.target.value }
        },
        mode: {
            type: "select",
            options: ["absolute", "relative"],
            title: "Relative mode moves both control points relative to the edge direction",
            onchange(ev) { UI.inspector.observed.setAttribute("mode", ev.target.value) }
            
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
                class: "text-hover",
                onclick: UI.highlight,
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
                condition() { return Graph.selected.type == Graph.ORDERED },
                title: "Number of nodes entering this node",
            },
            outer: {
                type: "number",
                readonly: "true",
                display: "Outer degree",
                condition() { return Graph.selected.type == Graph.ORDERED },
                title: "Number of nodes exiting this node",
            },
        },
        "Adjacent nodes": {},
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


class Inspector extends TabArea{
    /**@param {MutationRecord[]} mutations */
    static tabObserver = new MutationObserver((mutations) => {
        let updateGraph = 0, updateNode = 0, updateEdge = 0;
        for (let mutation of mutations) {
            let tab = mutation.target;
            let nd = UI.inspector.details.node;
            let ed = UI.inspector.details.edge;

            if (UI.inspector.activeTab.matches("[name='graph']")) { updateGraph++; break; }

            mutation.removedNodes.forEach(removed => {
                if (nd.observed === removed) {
                    nd.classList.remove("valid");
                    nd.observed = undefined;
                } else if (ed.observed === removed) {
                    ed.classList.remove("valid");
                    ed.observed = undefined;
                }
            })
            for (const added of mutation.addedNodes) {
                
                if (added.matches("GRAPH-EDGE") && UI.inspector.activeTab.matches("[name='node']")
                    && tab.getEdge(nd.observed.nodeId, added.to)) { updateNode++; console.log("jbdwjheb"); break; }
                //if (!updateEdge && added.matches("GRAPH-NODE") && tab.getGraph().isEdge(nd.observe?.nodeId, added.nodeId))return updateNode++;
            }
        }
        if (updateGraph || updateNode || updateEdge) UI.inspector.observe();
    })
    static elementToTab = {
        "GRAPH-NODE": "node", 
        "GRAPH-EDGE": "edge", 
        "GRAPH-TAB": "graph", 
    }
    constructor() {
        super();
        this.observed = null;
        this.size = new Point();
        this.sizeObserver = new ResizeObserver(([item]) => this.size.set(item.borderBoxSize[0].inlineSize, item.borderBoxSize[0].blockSize));
        this.nodeStorage = {};
        this.graphStorage = {};
        this.edgeStorage = {};
        this.timer = undefined;
        this.deltaTime = 100;

        this.addEventListener("keydown", (ev) => ev.stopPropagation());
        this.addEventListener("change", (ev) => {

            let chain = CustomInputs.getChainFromEvent(this, ev);
            let value = ev.target.parentElement.get();
            let last = chain.pop();
            CustomInputs.setFromChain(this.observed, chain, value);
            if (chain[0] == "x" || chain[0] == "y") this.observed.update();
        })
    }

    connectedCallback() {
        super.connectedCallback();
        this.sizeObserver.observe(this);

        this.details = {
            node: this.getTab("node").appendChild(CustomInputs.category("", InspectorTemplates.node)),
            edge: this.getTab("edge").appendChild(CustomInputs.category("", InspectorTemplates.edge)),
            graph: this.getTab("graph").appendChild(CustomInputs.category("", InspectorTemplates.graph)),
        }
        this.details.node.querySelector("[name='Adjacent nodes']").appendChild(UI.createNodeList());
        this.details.graph.querySelector("[name='Conex parts']").appendChild(UI.createComponentList());

        this.addEventListener("opened", (ev) => {
            this.updateFrom(this.details[ev.detail.new].observed);
        })
    }




    observe(element = this.observed) {
        if (!this.timer) {
            this.timer = true;
            setTimeout(_ => this.timer = null, this.deltaTime);
        } else return;

        this.updateFrom(element);
        this.observed = element;
        this.selectTab(Inspector.elementToTab[element.tagName]);
    }
    updateFrom(element) {
        if (!element) return;
        let details = this.details[Inspector.elementToTab[element.tagName]];  
        details.observed = element;
        details.validate();
        details.classList.add("valid");
        switch (element.tagName) {
            case "GRAPH-NODE": {  
                details.load(this.extractNodeData(element));
                break;
            }
            case "GRAPH-TAB": {
                Inspector.tabObserver.disconnect();
                Inspector.tabObserver.observe(element,{childList: true,subtree: true})
                details.load(this.extractGraphData(element.getGraph()));
                break;
            }
            case "GRAPH-EDGE": {;
                details.load(this.extractEdgeData(element));
                break;
            }
        }
    }

    /**@param {NodeUI} node*/
    extractNodeData(node) {
        this.nodeStorage={
            id: node.nodeId,
            mass: node.mass,
            template: node.template,
            description: node.description,
            transform: node.transform,
        }
        let g = node.getGraph();
        let degree = g.getDegree(this.nodeStorage.id);
        if (g.type == Graph.UNORDERED) this.nodeStorage.degree = degree;
        else {
            this.nodeStorage.degree = degree.inner + degree.outer;
            this.nodeStorage.inner = degree.inner;
            this.nodeStorage.outer = degree.outer;
        }

        let list = this.details.node.querySelector("[name='Adjacent nodes'] list-view");
        list.setAttribute("for", g.id);
        list.clear();
        list.list = Array.from(g.adjacentNodes(node.nodeId)).filter(el => el > 0).sort();
        list.render();

        return this.nodeStorage;
    }
    extractEdgeData(edge) {
        this.edgeStorage = {
            from: edge.from,
            to: edge.to,
            symmetry: edge.symmetry,
            mode: edge.mode,
        }
        return this.edgeStorage;
    }
    extractGraphData(graph) {
        this.graphStorage = {
            name: graph.settings.name,
            id: graph.id,
            type: (graph.type ?"Ordered" : "Unordere") + (graph.isTree() ? " tree" : ""),
            edgeCount: graph.edgeCount,
            nodeCount: graph.nodeCount,
        }
        let list = this.details.graph.querySelector("[name='Conex parts'] list-view");
        let components = graph.conexParts();
        components.array.shift();
        list.clear();
        list.list = components.array;
        list.render();
        list.querySelectorAll("list-view").forEach(el => el.render());

        return this.graphStorage;
    }
}

customElements.define("graph-inspector", Inspector);