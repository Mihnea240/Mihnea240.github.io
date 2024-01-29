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
        let g = this.getGraph(), commands = [],addNodes=new GroupCommands();
        for (let n of this.nodeSet) {
            g.removeNode(n.nodeId);
            commands.push(g.actionsStack.pop());
        }

        for (let c of commands) addNodes.push(c.commands.shift());
        g.actionsStack.push(new GroupCommands(addNodes, ...commands));
    }
    deleteEdges() {
        let g = this.getGraph(), action = new RemoveEdgesCommand();
        for (let e of this.edgeSet) {
            g.removeEdge(e.fromNode, e.toNode, false);
            action.edgeIds.push([e.fromNode, e.toNode]);
        }
        if (action.edgeIds.length) g.actionsStack.push(action);

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