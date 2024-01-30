class GraphSelection {
    constructor(graphId) {
        /**@type {Set<nodeUI>}*/
        this.nodeSet = new Set();

        /**@type {Set<edgeUI>}*/
        this.edgeSet = new Set();

        this.graphId = graphId;
    }

    toggle(el, force) {
        if (force === undefined) {
            if (el.selected) this.remove(el);
            else this.add(el)
        } else if (force) this.add(el);
        else this.remove(el);
    }

    add(el) {
        let set;
        if (el.tagName === "GRAPH-NODE") set = this.nodeSet;
        else if (el.tagName === "GRAPH-EDGE") set = this.edgeSet;
        else return;

        el.selected = true;
        set.add(el);
    }

    remove(el) {
        let set;
        if (el.tagName === "GRAPH-NODE") set = this.nodeSet;
        else if (el.tagName === "GRAPH-EDGE") set = this.edgeSet;
        else return;

        el.selected = false;
        set.delete(el);
    }

    deleteNodes() {
        let g = this.getGraph(), commands = [];
        g.actionsStack.startGroup();
        for (let n of this.nodeSet) g.removeNode(n.nodeId);
        g.actionsStack.endGroup();
    }
    deleteEdges() {
        let g = this.getGraph();
        g.actionsStack.startGroup();
        for (let e of this.edgeSet) g.removeEdge(e.fromNode, e.toNode);
        g.actionsStack.endGroup();
    }
    getGraph() {
        return Graph.get(this.graphId);
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