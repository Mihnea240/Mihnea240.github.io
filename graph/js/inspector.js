
function initInspector() {
    addCustomDrag(inspector, {
        onstart(ev, delta) {
            if (ev.offsetX > 5) return false;
            return true;
        },
        onmove(ev, delta) {
            inspector.size.x -= delta.x;
            inspector.style.width = inspector.size.x + "px";
            inspector.style.cssText += `width: ${inspector.size.x}px; min-width: none;`;
        }
    });

}

class Inspector extends TabArea{
    constructor() {
        super();
        this.observed = null;
        this.size = new Point();
        this.sizeObserver = new ResizeObserver(([item]) => this.size.set(item.borderBoxSize[0].inlineSize, item.borderBoxSize[0].blockSize));
        this.nodeStorage = {};
        this.graphStorage = {};
        this.edgeStorage = {};

        //tabArea.addEventListener("nodemoved",(ev))
    }

    connectedCallback() {
        super.connectedCallback();
        this.viewTabs = {
            graph: this.getTab("graph"),
            node: this.getTab("node"),
            edge: this.getTab("edge"),
        }
        this.sizeObserver.observe(this);

        let scrollIntoView = () => {
            inspector.observed.scrollIntoView();
            Graph.selected.selection.toggle(inspector.observed);
        }
        let onchange = (ev) => {
            let chain = CustomInputs.getChainFromEvent(this, ev);
            chain.pop();
            let value = ev.target.parentElement.get();
            console.log(chain, value);
            CustomInputs.setFromChain(inspector.observed, chain, value);
            if (chain[0] == "x" || chain[0] == "y") inspector.observed.update();
        }

        this.nodeDetails = this.viewTabs.node.appendChild(CustomInputs.category("Viewing", nodeInspectorTemplate));
        this.nodeSpan = this.nodeDetails.firstElementChild.appendChild(elementFromHtml(`<span style="margin-left: 2rem;"></span>`));
        this.nodeSpan.addEventListener("click", scrollIntoView);
        this.nodeDetails.addEventListener("change", onchange);

        this.edgeDetails = this.viewTabs.edge.appendChild(CustomInputs.category("Viewing", edgeInspectorTemplate));
        this.edgeSpan = this.nodeDetails.firstElementChild.appendChild(elementFromHtml(`<span style="margin-left: 2rem;"></span>`));
        this.edgeSpan.addEventListener("click", scrollIntoView);
        this.edgeDetails.addEventListener("change", onchange);
        
        this.graphDetails=this.viewTabs.graph.appendChild(CustomInputs.category("Viewing", graphInspectorTemplate));
        this.graphDetails.addEventListener("change", onchange);
    }




    observe(element=this.observed) {
        switch (element.tagName) {
            case "GRAPH-NODE": {
                
                this.nodeDetails.validate();
                this.nodeDetails.load(this.extractNodeData(element));
                this.nodeSpan.textContent = "#" + element.nodeId;

                this.getHeader("node").click();
                break;
            }
            case "GRAPH-TAB": {
                element = element.getGraph();
                this.graphDetails.validate();
                this.graphDetails.load(this.extractGraphData(element));

                this.getHeader("graph").click();
                break;
            }
            case "GRAPH-EDGE": {
                this.edgeDetails.validate();
                this.edgeDetails.load(this.extractEdgeData(element));
                this.edgeSpan.textContent = `#${element.from} ${element.to}`;

                this.getHeader("edge").click();
                break;
            }
            default: return;
        }
        this.observed = element;
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
        if (g.type == UNORDERED) this.nodeStorage.degree = degree;
        else {
            this.nodeStorage.degree = degree.inner + degree.outer;
            this.nodeStorage.inner = degree.inner;
            this.nodeStorage.outer = degree.outer;
        }
        //console.log(this.nodeStorage)
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
            name: graph.settings.graph.name,
            id: graph.id,
            type: (graph.type ? "Unordere" : "Ordered") + (graph.isTree() ? " tree" : ""),
            edgeCount: graph.edgeCount,
            nodeCount: graph.nodeCount,
        }

        return this.graphStorage;
    }
}

customElements.define("graph-inspector", Inspector);