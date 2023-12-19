class GraphSelection {
    constructor() {
        /**@type {Set<nodeUI>}*/
        this.nodeSet = new Set();

        /**@type {Set<edgeUI>}*/
        this.edgeSet = new Set();
    }

    toggle(el) {
        if (el.tagName === "GRAPH-NODE") {
            if (this.nodeSet.has(el)) {
                this.nodeSet.delete(el);
                el.selected = false;
                return false;
            }
            this.nodeSet.add(el);
            el.selected = true;
            return true;
        } else if (el.tagName === "GRAPH-EDGE") {
            if (this.edgeSet.has(el)) {
                this.edgeSet.delete(el);
                el.selected = false;
                return false;
            }
            this.edgeSet.add(el);
            el.selected = true;
            return true;
        }
    }

    clear() {
        for (let n of this.nodeSet) n.selected = false;
        for (let e of this.edgeSet) e.selected = false;
        this.nodeSet.clear();
        this.edgeSet.clear();
    }

    empty() {
        return (this.nodeSet.size + this.edgeSet.size) == 0;
    }
    nodeArray() {
        return Array.from(this.nodeSet);
    }
}