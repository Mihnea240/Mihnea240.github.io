const ORDERED = 1;
const UNORDERED = 0;

class Graph{
    static id = 0;
    constructor(input,type) {
        this.id = ++Graph.id;
        this.type = type;
        createTabUI(this.id);

        this.tab = document.getElementById("g" + this.id);
        this.header = document.getElementById("h" + this.id);
        
        this.nodes = new Map();
        this.a_nodeId = 1;

        this.addNode();
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
    rename(newName=0) {
        if (newName == 0) {
            this.header = 1;
        }
    }

    addNode() {
        while (this.nodes.has(this.a_nodeId)) this.a_nodeId++;
        this.nodes.set(this.a_nodeId, new Set());
        let newNode = this.tab.appendChild(elementFromHtml(`<graph-node id="g${this.id} ${this.a_nodeId}" ></graph-node>`));
        return newNode;
    }
    removeNode(id) {
        this.tab.classList.add("hide");
        this.tab.connectedEdges(id).forEach(ed => {
            if (ed.fromNode == id) this.nodes.get(ed.toNode).delete(id);
            else this.nodes.get(ed.fromNode).delete(id);
            this.tab.removeChild(ed);
        })
        this.tab.removeChild(this.tab.getNode(id));
        this.tab.classList.remove("hide");

        let rez = this.nodes.delete(id);
        if (rez && id < this.a_nodeId) this.a_nodeId = id;
        return rez;
    }
    addEdge(x, y) {
        if ((x == y) || this.isEdge(x, y) || (this.type == UNORDERED && this.isEdge(y, x))) return;
        
        this.nodes.get(x).add(y);
        let n1 = this.tab.getNode(x);
        let n2 = this.tab.getNode(y);
        
        let edge = this.tab.appendChild(elementFromHtml(`<graph-edge id="g${this.id} ${x} ${y}"></graph-edge>`));
        /*edge.offset = 0;
        if (this.type == ORDERED) {
            edge.offset=10;
            if (this.getEdgeUI(y, x)) edge.offset=-10;
        } else */
        if (this.type == UNORDERED) this.nodes.get(x).add(y);
        
        edge.from = n1.middle(); edge.to = n2.middle();
    }
    removeEdge(x, y) {
        let rez = this.nodes.get(x)?.delete(y);
        if (rez) {
            this.tab.removeChild(this.tab.getEdge(x, y));
            if(this.type == UNORDERED)this.get(y).delete(x);
        }
        return rez;
    }
    isEdge(x,y) {
        return this.nodes.get(x)?.has(y);
    }
}