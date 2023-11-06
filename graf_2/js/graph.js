const ORDERED = 1;
const UNORDERED = 0;

class Graph{
    static id = 0;
    constructor() {
        this.id = ++Graph.id;
        this.type;
        createTabUI(this.id);

        this.tab = tabArea.querySelector(`[data-id="${this.id}"]`);
        this.header = headerArea.querySelector(`[data-id="${this.id}"]`);
        
        this.nodes = new Map();
        this.a_nodeId = 0;
        this.addNode();
        this.tab.appendChild(elementFromHtml("<graph-edge></graph-edge>"))
    }

    unfocus() {
        this.header?.classList.remove("selected");
        this.tab?.classList.add("hide");
    }
    focus() {
        let header = this.header,tab = this.tab;
        graphs.selected?.unfocus();
        graphs.selected = this;

        header.classList.add("selected")
        tab.classList.remove("hide");
        headerArea.style.borderImage = header.style.background + " 1";
    }

    addNode() {
        while (this.nodes.has(this.a_nodeId)) this.a_nodeId++;
        this.nodes.set(this.a_nodeId, new Set());
        this.tab.appendChild(elementFromHtml(`<graph-node id="g${this.id}_${this.a_nodeId}" ></graph-node>`))
    }
    removeNode(id) {
        let neighbours = this.nodes.get(id);
        if (!neighbours) return;
        if (this.type == UNORDERED) {
            for (node of neighbours) {
                this.nodes.get(node).delete(node);
                this.tab.remove(this.getEdgeUI(id, node));
                this.tab.remove(this.getEdgeUI(node, id));
            }
            this.nodes.delete(id);
            this.a_nodeId = id;
        } else {
            for (node of neighbours) this.tab.remove(this.getEdgeUI(id, node));
            for ([_, neighbours] of this.nodes) neighbours.delete(id);
            this.nodes.delete(id);
        }
    }
    getNodeUI(id) {
        return this.tab.querySelector("g" + this.id + "_" + id);
    }
    addEdge(x, y) {
        let a = this.nodes.get(x);
        let b = this.nodes.get(y);
        if (!(a && b && !a.has(y))) return;
        
        a.add(y);
        this.tab.appendChild(elementFromHtml(`<graph-edge id="g${this.id}_${x}|${y}" from=${x} to=${y}></graph-edge>`));
        
        if (this.type == UNORDERED) {
            b.add(x);
            this.tab.appendChild(elementFromHtml(`<graph-edge id="g${this.id}_${y}|${x}" from=${y} to=${x}></graph-edge>`));
        }
    }
    removeEdge(x,y) {
        if (!this.isEdge()) return;
        this.get(x).delete(y);
        this.tab.remove(this.getEdgeUI(x, y));

        if (this.type == UNORDERED) {
            this.get(y).delete(x);
            this.tab.remove(this.getEdgeUI(y, x));
        }
    }
    isEdge(x,y) {
        return this.get(x)?.has(y);
    }
    getEdgeUI(x,y) {
        return this.tab.querySelector("g" + this.id + "_" + x + "|" + y);
    }
}