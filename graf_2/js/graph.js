const ORDERED = 1;
const UNORDERED = 0;

const PositionFunctons = {
    randomScreen: (graph_tab,node) => {
        let x_off = graph_tab.scrollLeft;
        let y_off = graph_tab.scrollTop;
        let width = random(0, parseFloat(graph_tab.css.width));
        let height = random(0, parseFloat(graph_tab.css.height));

        node.position(x_off + width, x_off + height);
    }
}

class Graph{
    static id = 0;
    constructor(input,type) {
        this.id = ++Graph.id;
        this.type = type;
        this.positionFunction = PositionFunctons.randomScreen;
        createTabUI(this.id);

        this.tab = tabArea.querySelector(`[data-id="${this.id}"]`);
        this.header = headerArea.querySelector(`[data-id="${this.id}"]`);
        
        this.nodes = new Map();
        this.a_nodeId = 1;
        this.hasMoved = (nodeId, point) => {

            this.connectedEdges(nodeId).forEach((ed) => {
                
            })
            /*for (let n of this.nodes.get(nodeId)) {
                let a = this.getEdgeUI(nodeId, n);
                let b = this.getEdgeUI(n, nodeId);
                console.log(a,b)
                if(a)a.from = point;
                if(b)b.to = point;
            }*/
        }


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

    addNode() {
        while (this.nodes.has(this.a_nodeId)) this.a_nodeId++;
        this.nodes.set(this.a_nodeId, new Set());
        let newNode = this.tab.appendChild(elementFromHtml(`<graph-node id="g${this.id} ${this.a_nodeId}" ></graph-node>`));

        this.positionFunction(this.tab, newNode);

        return newNode;
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
        return document.getElementById("g" + this.id + " " + id);
    }
    addEdge(x, y) {
        if ((x == y) || this.isEdge(x, y) || (this.type == UNORDERED && this.isEdge(y, x))) return;
        
        this.nodes.get(x).add(y);
        let n1 = this.getNodeUI(x);
        let n2 = this.getNodeUI(y);
        
        let edge = this.tab.appendChild(elementFromHtml(`<graph-edge id="g${this.id} ${x} ${y}"></graph-edge>`));
        /*edge.offset = 0;
        if (this.type == ORDERED) {
            edge.offset=10;
            if (this.getEdgeUI(y, x)) edge.offset=-10;
        } else */
        if (this.type == UNORDERED) this.nodes.get(x).add(y);
        
        edge.from = n1.middle(); edge.to = n2.middle();
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
        return this.nodes.get(x)?.has(y);
    }
    getEdgeUI(x,y) {
        return document.getElementById("g" + this.id + " " + x + " " + y);
    }
    positionNodes() {
        this.tab.classList.add("hide");
        this.tab.querySelectorAll("graph-node").forEach(node => {
            this.positionFunction(this.tab, node);
        });
        
        this.tab.classList.remove("hide");
    }
}