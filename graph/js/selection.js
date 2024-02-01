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
        for (let n of this.nodeSet) g.removeNode(n.nodeId), console.log(g.actionsStack.top());
        g.actionsStack.endGroup();
    }
    deleteEdges() {
        let g = this.getGraph();
        g.actionsStack.startGroup();
        for (let e of this.edgeSet) g.removeEdge(e.fromNode, e.toNode);
        g.actionsStack.endGroup();
    }
    deleteAll() {
        let g = this.getGraph();
        g.actionsStack.startGroup();
        for (let n of this.nodeSet) g.removeNode(n.nodeId);
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

    toJSON() {
        let g = this.getGraph();
        if (g.selection.empty()) return;
        let data = {
            nodes: [],
            edges: [],
        }
        for (let n of this.nodeSet) data.nodes.push(n.props);
        for (let e of this.edgeSet) data.edges.push(e.props);
        return JSON.stringify(data);
    }

    static parseFromJSON(obj) {
        let g = Graph.selected, idMap = new Map();
        let min = new Point(Infinity, Infinity);
        let newNodes = [];

        for (let props of obj.nodes) {
            let { x, y } = props.physics.transform.position;
            min.x = Math.min(min.x, x);
            min.y = Math.min(min.y, y);
        }

        g.tab.screenToWorld(appData.cursorPos);
        min.set(appData.cursorPos.x - min.x, appData.cursorPos.y - min.y);
    
        g.actionsStack.startGroup();
        for (let props of obj.nodes) {
            if (props.details.description == props.details.id) props.details.description = "";
            props.states.selected = false;
            idMap.set(props.details.id, props.details.id = g.nextAvailableID());

            newNodes.push(g.addNode(props));
        }
        for (let props of obj.edges) {
            props.from = idMap.get(props.from);
            props.to = idMap.get(props.to);
            props.states.selected = false;
            g.addEdge(props);
        }
        g.actionsStack.endGroup();

        for (const n of newNodes) n.translate(min.x, min.y);
    }
}