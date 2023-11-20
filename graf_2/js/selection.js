class Selection{
    constructor() {
        this.nodeSet = new Set();
        this.edgeSet = new Set();
    }

    add(el) {
        if (el.tagName === "GRAPH-NODE") {
            this.nodeSet.add(el);
        }else if (el.tagName === "GRAPH-EDGE") {
            this.edgeSet.add(el);
        }
    }

    delete(el) {
        if (el.tagName === "GRAPH-NODE") {
            this.nodeSet.delete(el);
        }else if (el.tagName === "GRAPH-edge") {
            this.edgeSet.delete(el);
        }
    }

    clear() {
        for (let n of this.nodeSet) n.selected = false;
        for (let e of this.nodeSet) e.selected = false;
        this.nodeSet.clear();
        this.edgeSet.clear();
    }

    empty() {
        return (this.nodeSet.size + this.edgeSet.size) == 0;
    }
}