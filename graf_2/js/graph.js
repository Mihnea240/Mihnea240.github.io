const ORDERED = 1;
const UNORDERED = 0;

class Graph {
    static id = 0;
    constructor(input, type,settings) {
        this.id = ++Graph.id;
        this.type = type;
        this.selection = new GraphSelection();
        this.settings = createGraphSettings(this);
        
        createTabUI(this.id);
        /**@type {Tab} */
        this.tab = document.getElementById("g" + this.id);
        this.header = document.getElementById("h" + this.id);
        
        
        /**@type {Map<number,Set<number>>} */
        this.nodes = new Map();
        this.a_nodeId = 1;
    }

    unfocus() {
        this.header?.classList.remove("selected");
        this.tab?.classList.add("hide");
    }
    focus() {
        let header = this.header, tab = this.tab;
        graphs.selected?.unfocus();
        graphs.selected = this;

        header.classList.add("selected")
        tab.classList.remove("hide");
        headerArea.style.borderImage = header.style.background + " 1";
    }
    addNode() {
        while (this.nodes.has(this.a_nodeId)) this.a_nodeId++;
        this.nodes.set(this.a_nodeId, new Set());
        return  this.tab.addNode({ id: this.a_nodeId });
    }
    removeNode(id) {

        let n = this.tab.getNode(id);
        this.tab.removeChild(n);
        if (n.selected) this.selection.toggle(n);

        for (let n1 of this.nodes.get(id)) {
            if (n1 < 0) this.removeEdge(-n1, id);
            else this.removeEdge(id, n1);
        }

        let rez = this.nodes.delete(id);
        if (rez && id < this.a_nodeId) this.a_nodeId = id;
        return rez;
    }
    addEdge(x, y) {
        if ((x == y) || this.isEdge(x, y) || (this.type == UNORDERED && this.isEdge(y, x))) return;

        let reverse = false;
        let xSet = this.nodes.get(x);
        let ySet = this.nodes.get(y);
        
        if (xSet.has(-y)) {
            xSet.delete(-y);
            reverse = true;
        } else ySet.add(-x);

        if (this.type == UNORDERED) ySet.add(x);
        xSet.add(y);

        let offset = this.settings.edge.cp_offset;
        return this.tab.addEdge({
            from: x,
            to: y,
            type: this.type,
            cp_offset: new Point(offset[0],offset[1]),
            cp_symmetry: this.settings.edge.cp_symmetry,
            mode: this.settings.edge.mode,
            reverse 
        })
       
    }
    removeEdge(x, y) {
        let rez = this.nodes.get(x)?.delete(y);
        if (rez) {
            let e = this.tab.getEdge(x, y);
            this.tab.removeChild(e);

            if (e.selected) this.selection.toggle(e);
            if (this.type == UNORDERED) this.nodes.get(y).delete(x);
            else this.nodes.get(y).delete(-x);
        }
        return rez;
    }
    isEdge(x, y) {
        return this.nodes.get(x)?.has(y) > 0;
    }
}