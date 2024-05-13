class GraphSelection {
    constructor(graphId) {
        /**@type {Set<nodeUI>}*/
        this.nodeSet = new Set();

        /**@type {Set<edgeUI>}*/
        this.edgeSet = new Set();

        this.graphId = graphId;
        this.stack = [];

       /*  this.positionStack = [];
        this.dfs = new Dfs(this.getGraph());
        this.dfs.conditions = [(node, handler) => !handler.frMap.has(`${handler.lastVisited()}|${node}`)];
        
        this.dfs.onvisit = [(node, handler) => {
            console.log(node);
            this.positionStack.push(handler.graph.getNodeUI(node).transform.position);
            handler.stack.push(node);
            if (handler.stack.size > 1) handler.frMap.set(`${handler.lastVisited(2)}|${handler.lastVisited()}`);
        }];
        this.dfs.onreturn.push((top) => {
            let edge = this.dfs.graph.getEdgeUI(this.dfs.lastVisited(2), this.dfs.lastVisited(1));
            edge.translateFrom(this.positionStack.at(-2), false);
            edge.translateTo(this.positionStack.at(-2));
            this.positionStack.pop();
        }) */
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
        let g = this.getGraph();
        g.actionsStack.startGroup();
        for (let n of this.nodeSet) g.removeNode(n.nodeId), console.log(g.actionsStack.top());
        g.actionsStack.endGroup();
    }
    deleteEdges() {
        let g = this.getGraph();
        g.actionsStack.startGroup();
        for (let e of this.edgeSet) g.removeEdge(e.from, e.to);
        g.actionsStack.endGroup();
    }
    deleteAll() {
        let g = this.getGraph();
        g.actionsStack.startGroup();
        for (let e of this.edgeSet) g.removeEdge(e.from, e.to);
        for (let n of this.nodeSet) g.removeNode(n.nodeId);
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

    static center(nodeList) {
        let length = nodeList.size || nodeList.length;
        if (length) return;

        let center = new Point();
        for (const n of nodeList) center.translate(n.transform.position.x, n.transform.position.y);
        return center.multiplyScalar(1 / length);
    }
    
    static translate(nodeList, dx, dy) {
        let length = nodeList.size || nodeList.length;
        if (!length) return;
        for (const n of nodeList) n.translate(dx, dy, false);
        this.updateEdges(nodeList);
    }
    static rotate(nodeList, angle, pivot = Point.ORIGIN) {
        let aux = new Point();
        for (const n of nodeList) {
            aux.copy(n.transform.position);
            aux.rotateAround(angle, pivot);
            n.position(aux.x, aux.y, false);
        }
        this.updateEdges(nodeList);
    }
    static updateEdges(nodeList) {
        let graph;
        for (graph of nodeList) break;
        graph = graph.getGraph();

        let queue = [];
        for (const node of nodeList) graph.tab.recalculateEdges(node.nodeId, node.anchor(), queue);
        for (const edge of queue) edge.update();

    }
    center() { return GraphSelection.center(this.nodeSet) };
    translate(dx, dy) { GraphSelection.translate(this.nodeSet, dx, dy) }
    rotate(angle, pivot = Point.ORIGIN) { GraphSelection.rotate(this.nodeSet, angle, pivot) }


    getTop() {
        return this.nodeArray().at(-1);
    }

    push() {
        
    }

    moveInDepth(dir=1) {
        let array = this.nodeArray();
        let graph = this.getGraph();

        if (dir < 0) {
            
        }

        for (const node of graph.adjacentNodes(top)) {
            let n = graph.getNodeUI(node);

            if (n.selected) continue;


            this.add(n);
        }
    }
    visitSiblings() {
        
    }


    toJSON() {
        let g = this.getGraph();
        if (g.selection.empty()) return;
        let data = {
            nodes: [],
            edges: [],
        }
        for (let n of this.nodeSet) data.nodes.push(n.toJSON());
        for (let e of this.edgeSet) data.edges.push(e.toJSON());
        return data;
    }

    static parseFromJSON(obj) {
        let g = Graph.selected, idMap = new Map();
        let min = new Point(Infinity, Infinity);
        let newNodes = [];

        for (let props of obj.nodes) {
            let { x, y } = props.transform.position;
            min.x = Math.min(min.x, x);
            min.y = Math.min(min.y, y);
        }

        g.tab.screenToWorld(appData.cursorPos);
        min.set(appData.cursorPos.x - min.x, appData.cursorPos.y - min.y);
    
        g.actionsStack.startGroup();
        for (let props of obj.nodes) {
            if (props.description == props.nodeId) props.description = "";
            idMap.set(props.nodeId, props.nodeId = g.nextAvailableID());

            newNodes.push(g.addNode(props));
        }
        for (let props of obj.edges) {
            props.from = idMap.get(props.from);
            props.to = idMap.get(props.to);
            g.addEdge(props);
        }
        g.actionsStack.endGroup();

        for (const n of newNodes) n.translate(min.x, min.y);
    }
}