
const _tab_template =/*html*/`
    <style>
        :host{
            position: absolute;
            width: 100%;  height:100%;
            zoom: var(--zoom);
        }
        #square{
            position: absolute;
            width: 100%;  height:100%;
            background-color: transparent;
            pointer-events:none;
            user-select: none;
           
        }
        .tab{
            position: absolute;
            overflow: scroll;
            width: 100%;  height:100%;
            background: inherit;
            z-index: -2;
        }
        ::-webkit-scrollbar{
            background-color: inherit;
            width: 8px;    height: 8px;
            z-index: 5;
        }
        ::-webkit-scrollbar-corner{
            
        }
        ::-webkit-scrollbar-thumb{
            background-color: rgba(0, 0, 0, 0.47);
            border-radius: .2em;
        }
        .hide{display: none}
        list-view{
            display: var(--show-ruller);
            position: absolute; z-index:10;
            font-size: .7rem;
        }

        list-view[direction="row"]{
            width: 100%;
            bottom: 0; left: 0;
            & >*{
                min-width: 3rem;
            }
        }
        list-view[direction="column"]{
            height: 100%;
            right: 0; top: 0;
            & >*{
                min-height: 3rem;
            }
        }
        #selectionRect{
            position: absolute;
            display: none;
            background-color: var(--ui-select);
            opacity: 0.6;
            z-index: 304;
        }
    </style>

    
    
    <div class="tab" name="tab">
        <div id="square" draggable="false"></div>
        <div id="selectionRect"></div>
        <curved-path class="hide" style="position: absolute"></curved-path>
        <slot name="nodes"></slot>
        <slot name="edges"></slot>
  
    </div>
    <list-view autofit="true" autoflow="true" direction="row"></list-view>
    <list-view autofit="true" autoflow="true" direction="column"></list-view>
`

const PositionFunctons = {
    randomScreen: (graph_tab, node, recalculateEdges) => {
        let x_off = graph_tab.tab.scrollLeft;
        let y_off = graph_tab.tab.scrollTop;
        let width = random(0, parseFloat(graph_tab.css.width));
        let height = random(0, parseFloat(graph_tab.css.height));

        node.position(x_off + width, y_off + height,recalculateEdges);
    }
}
const storage = {
    point: new Point(),
    rect: {},
    visibleItems: undefined,
    timer: 12,
    timerMax:12,
}
const dragHandle = {
    
    tabDrag: (target, ev, delta) => {
        target.shadowRoot.querySelector("list-view").move(-delta.x);
        if (ev.buttons == 4) {
            ev.preventDefault();
            for (let n of target.getGraph().selection.nodeSet) {
                n.translate(delta.x, delta.y);
                n.transform.velocity.copy(appData.cursorVelocity);
                
            }
            return;
        }
        //collision detection with selection square
        
        if (ev.buttons == 2) {
            let { x, y } = target.screenToWorld(storage.point.set(ev.clientX, ev.clientY));
            let p = target.selectionRect.pos.clone();
            if (x < p.x) [storage.point.x, p.x] = [p.x, storage.point.x];
            if (y < p.y) [storage.point.y, p.y] = [p.y, storage.point.y];
            
            x = Math.abs(storage.point.x - p.x);
            y = Math.abs(storage.point.y - p.y);
           
            target.selectionRect.style.cssText += `
                left: ${p.x}px;
                top: ${p.y}px;
                width: ${x}px;
                height: ${y}px;
                display: block;
            `
            if (storage.timer < 0) storage.timer = storage.timerMax;
            else return storage.timer--;

            storage.rect.x = p.x; storage.rect.y = p.y;
            storage.rect.width = x; storage.rect.height = y
            
            storage.visibleItems ||= visibleElements(target.getGraph());
            
            for (let [el, rect] of storage.visibleItems) {
                el.selected = AABB(storage.rect, rect);
            }
            return;
        }
        let rect = target.square.getBoundingClientRect();
        target.canvasSize(rect.width - delta.x, rect.height - delta.y);
        target.tab.scrollBy(-delta.x, -delta.y);
    },
    tabDragEnd(target, ev) {
        //clear selection square
        if (ev.button == 2) {
            if (storage.visibleItems) {
                ev.stopPropagation(); 
                
                let sel = target.getGraph().selection;
                for (let [el,rect] of storage.visibleItems) sel.toggle(el, el.selected);

                storage.visibleItems = undefined;
                target.selectionRect.style.display = "none";
            }
        }
    },
    nodeDrag: (target, ev, delta) => {
        if (target.focused) return;
        if (ev.ctrlKey) {
            for (let n of target.getGraph().selection.nodeSet) {
                n.translate(delta.x, delta.y);
                n.transform.velocity.copy(appData.cursorVelocity);
            }
            return;
        }
        switch (ev.buttons) {
            case 1: {
                target.translate(delta.x, delta.y);
                break;
            }
            case 2: {
                let tab = target.parentElement;
                if (target.new_node_protocol == false) {
                    target.initCurve();
                    let p = target.anchor();
                    tab.curve.fromPosition(p);
                    tab.curve.toPosition(p);
                }
                tab.curve.translateTo(delta);
            } 
            default: return;
        }
        
        target.active = true;
    },
    nodeDragEnd: (originalNode, ev) => {
        if (originalNode.new_node_protocol) {
            originalNode.initCurve();
            
            let graph = Graph.get(originalNode.graphId)

            ev.stopPropagation();
            if (ev.target.tagName == "GRAPH-NODE") graph.addEdge({from: originalNode.nodeId,to: ev.target.nodeId});
            else {
                graph.actionsStack.startGroup();

                let newNode = graph.addNode();
                storage.point.set(ev.clientX, ev.clientY);
                
                originalNode.parentElement.screenToWorld(storage.point);
                
                newNode.position(storage.point.x, storage.point.y);
                
                graph.addEdge({from: originalNode.nodeId,to: newNode.nodeId});
                
                graph.actionsStack.endGroup();
            }
        }
        originalNode.transform.velocity.copy(appData.cursorVelocity);
        originalNode.active = false;
        //if(ev.button==2)ev.stopPropagation();
    },
    edgeDrag: (target, ev, delta) => {
        if (ev.button) return ev.stopPropagation();
        let tab = target.parentElement, c = tab.curve;
        if (delta.magSq() < tab.settings.edge.min_drag_dist) return;

        if (storage.fromNode.new_node_protocol == false) {
            target.classList.add("hide");
            storage.fromNode.initCurve();
            tab.screenToWorld(storage.point.set(ev.clientX, ev.clientY));
            c.to=storage.point;
        }
        c.translateTo(delta,false);
        c.translateP2(delta);
    },
    edgeDragEnd: (originalEdge,ev) => {
        if (storage.fromNode?.new_node_protocol);
        else return;
        storage.fromNode.new_node_protocol = false;

        let graph = Graph.get(originalEdge.graphId);
        originalEdge.parentElement.curve.classList.add("hide");

        if (ev.target.tagName == "GRAPH-NODE") {
            if (ev.target.nodeId != originalEdge.to) graph.addEdge({ from: storage.fromNode.nodeId, to: ev.target.nodeId });
            else {
                originalEdge.classList.remove("hide");
                return storage.fromNode = undefined;
            }
        } else {
            graph.actionsStack.startGroup();
            let newNode = graph.addNode();
            originalEdge.parentElement.screenToWorld(storage.point.set(ev.clientX, ev.clientY));
            newNode.position(storage.point.x, storage.point.y);
            graph.addEdge({ from: storage.fromNode.nodeId, to: newNode.nodeId });
            graph.actionsStack.endGroup();
        }
        
        graph.removeEdge(originalEdge.fromNode, originalEdge.toNode);
        storage.fromNode = undefined;
    },

}

class Tab extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _tab_template;

        this.square = shadow.getElementById("square");
        this.css = getComputedStyle(this);
        this.tab = this.shadowRoot.querySelector("div");
        this.curve = shadow.querySelector("curved-path");
        this.curve.setAttribute("mode", "absolute");
        this.positionFunction = PositionFunctons.randomScreen;
        this.graphId = parseInt(this.id.slice(1));
        this.zoom = 1;

        this.selectionRect = shadow.querySelector("#selectionRect");
        this.selectionRect.pos = new Point();

        let evTarget;
        addCustomDrag(this, {
            onstart: (ev) => {
                evTarget = ev.target;
                switch (ev.target.tagName) {
                    case "GRAPH-EDGE": storage.fromNode = this.getNode(ev.target.from); break;
                    case "GRAPH-NODE": {
                        if (ev.buttons == 4) ev.preventDefault(), evTarget = this;
                        /*this.screenToWorld(storage.point.set(ev.clientX, ev.clientY));
                        let v = storage.point.sub(ev.target.middle(1, 1)).magSq();
                        if (v < 250) return false;*/
                        break;
                    }
                    case "GRAPH-TAB": {
                        if (ev.buttons == 2) {
                            this.screenToWorld(this.selectionRect.pos.set(ev.clientX, ev.clientY));
                            ev.stopPropagation();
                            return true;
                        }
                        break; 
                    }     
                    default: return true;
                }
                return true;
            },
            onmove: (ev, delta) => {
                switch (evTarget.tagName) {
                    case "GRAPH-TAB": dragHandle.tabDrag(this, ev, delta); break;
                    case "GRAPH-NODE": dragHandle.nodeDrag(evTarget, ev, delta); break;
                    case "GRAPH-EDGE": dragHandle.edgeDrag(evTarget, ev, delta); break;
                }
                
            },
            onend: (ev) => {
                switch (evTarget.tagName) {
                    case "GRAPH-NODE": dragHandle.nodeDragEnd(evTarget, ev); break;
                    case "GRAPH-EDGE": dragHandle.edgeDragEnd(evTarget, ev); break;
                    case "GRAPH-TAB": dragHandle.tabDragEnd(evTarget, ev); break;
                }
            }

        })
        
        this.addEventListener("mouseup", (ev) => {
            if (ev.target.matches("graph-tab")) {
                if (ev.button !== 2) Graph.get(this.graphId).selection.clear();

                if (this.curvesArray.size) {
                    for (let c of this.curvesArray) c.active = false
                    this.curvesArray.clear();
                }
            } else { 
                ev.preventDefault();
                if (ev.detail == 2) return inspector.observe(ev.target);
                if (ev.target.matches("graph-node")) {
                    if (ev.detail == 3) ev.target.editText();
                    else if (ev.button == 2) this.getGraph().selection.toggle(ev.target);
                }
                else if (ev.target.matches("graph-edge")) {
                    if (ev.button == 2) this.getGraph().selection.toggle(ev.target);
                    else if (!ev.composedPath()[0].matches(".point")) ev.target.active = !ev.target.active;
                }
            }
        })

        
        let scale = 0.1, zoom;
        let lastPointer = new Point();
        let currentPointer = new Point();
        
        this.addEventListener("wheel", (ev) => {
            ev.preventDefault();
            if (ev.ctrlKey) {
                let set = this.getGraph().selection.nodeSet;
                if (!set.size) return;
                this.screenToWorld(currentPointer.set(ev.clientX, ev.clientY));
                for (let n of set) {
                    lastPointer.copy(currentPointer).sub(n.transform.position).multiplyScalar(0.1 * (ev.deltaY < 0 ? -1 : 1))
                    n.translate(lastPointer.x, lastPointer.y);
                }
                return;
            }
            this.zoom = this.settings.graph.zoom;
            this.screenToWorld(lastPointer.set(ev.clientX,ev.clientY));

            zoom = this.settings.graph.zoom;
            zoom += ev.deltaY < 0 ? -scale : scale;
            if (zoom < 0.1) zoom = scale;
            
            //this.settings.graph.zoom = zoom;
            this.getGraph().setSettings(["zoom","graph"], zoom);
            this.screenToWorld(currentPointer.set(ev.clientX, ev.clientY));

            this.classList.add("hide");
            for (let n of this.getNodeArray()) n.translate(currentPointer.x - lastPointer.x, currentPointer.y - lastPointer.y);

            this.classList.remove("hide");
            
        })

        this.sizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                entry.target.transform.size.set(entry.borderBoxSize[0].inlineSize, entry.borderBoxSize[0].blockSize);
                this.recalculateEdges(entry.target.nodeId);
            }
        })

        this.curvesArray = new Set();
        this.addEventListener("curveselect", (ev) => {
            if (ev.target.active) this.curvesArray.add(ev.target);
        })
    }

    focus(pos) {
        if (pos === undefined) {
            let selectedNodes = this.getGraph().selection.nodeSet;
            if (selectedNodes.size !== 0) pos = this.center(selectedNodes);
            else pos = this.center();
        }


        let rect = this.square.getBoundingClientRect();
        let newPos=pos.clone().translate(this.rect.width / 2, this.rect.height / 2);
        if (rect.width < newPos.x || rect.height < newPos.y) this.canvasSize(newPos.x, newPos.y);
        
        this.tab.scrollTo({
            left: newPos.x,
            top: newPos.y,
            behavior: "smooth",
        })
    }
    canvasSize(x,y) {
        this.square.style.cssText += `width: ${x}px; height: ${y}px`;
    }

    recalculateEdges(nodeId, point) {
        let g = this.getGraph();
        if (greatMenus.inspector.observed?.nodeId == nodeId) greatMenus.inspector.observe();
        this.forEdges((edge) => {
            if (point === undefined) return;
            
            if (edge.from === nodeId) edge.fromPosition(point);
            else if (edge.to === nodeId) edge.toPosition(point);
        }, nodeId);
    }
    forEdges(callBack, nodeId) {
        if (nodeId === undefined) {
            for (let edge of this.getEdgeArray()) callBack(edge);
            return;
        }
        let G = this.getGraph();
        let neighbourSet = G.adjacentNodes(nodeId),e;

        for (let node of neighbourSet) {
            node = Math.abs(node);
            e = G.getEdgeUI(node, nodeId);
            if (e) callBack(e);
            e = G.getEdgeUI(nodeId, node);
            if (e) callBack(e);
        }
    }

    addNode(props) {
        let newNode = this.appendChild(elementFromHtml(`<graph-node id="g${this.graphId} ${props.nodeId}" slot="nodes"></graph-node>`));
        this.sizeObserver.observe(newNode);
        newNode.init(props);

        if (newNode.transform.position.magSq() === 0) this.positionFunction(this, newNode, false);
        
        if (physicsMode.isRunning()) {
            physicsMode.stop();
            ACTIONS.togglePhysicsSimulation();
        }
        return newNode;
    }
    addEdge(props, type, overlapping) {
        let n1 = this.getNode(props.from);
        let n2 = this.getNode(props.to);
        let edge = this.appendChild(elementFromHtml(`<graph-edge id="g${props.graphId} ${props.from} ${props.to}" slot="edges"></graph-edge>`));
        let template = edge.getTemplate();
        
        edge.init(props, n1.anchor(), n2.anchor(), false);
        
        if (type == ORDERED) {
            edge.addArrow();

            if (overlapping) {
                let e2 = this.getEdge(props.to, props.from, true);
                let p = new Point(), bufferDistance = 100;
                if (template.pointOffsetWhenOverlapping &&
                    edge.relativeP1(p).magSq() < bufferDistance &&
                    edge.relativeP2(p).magSq() < bufferDistance &&
                    e2.relativeP1(p).magSq() < bufferDistance &&
                    e2.relativeP2(p).magSq() < bufferDistance
                ) {
                    let dir = edge.direction();
                    dir.set(dir.y, -dir.x).multiplyScalar(template.pointOffsetWhenOverlapping);
                    edge.P1.add(dir);
                    edge.P2.add(dir);
                    edge.pointData();
                    e2.P1.sub(dir);
                    e2.P2.sub(dir);
                    e2.pointData();
                    e2.update();
                } else if (template.offsetWhenOverlapping) {
                    /* edge.direction(p);
                    p.set(p.y, -p.x).multiplyScalar(edge.offset);

                    edge.translateTo(p)
                    edge.translateFrom(p);
                    p.multiplyScalar(-1);
                    e2.translateTo(p)
                    e2.translateFrom(p); */
                    
                }
    
            }
        }
        edge.update();
        return edge;
    }
    /**@returns {NodeUI} */
    getNode(id) {
        return document.getElementById(`g${this.graphId} ${id}`);
    }
    /**@returns {EdgeUI} */
    getEdge(x, y, type=this.getGraph().type) {
        if (type === UNORDERED && x > y) [x, y] = [y, x]; 
        return document.getElementById(`g${this.graphId} ${x} ${y}`);
    }

    getEdgeArray() {
        return this.shadowRoot.querySelector("slot[name='edges']").assignedNodes();
    }
    /**@returns {Array<NodeUI>} */
    getNodeArray() {
        return this.shadowRoot.querySelector("slot[name='nodes']").assignedNodes();
    }
    getGraph() {
        return Graph.get(this.graphId);
    }

    /**@param {Point} point*/
    screenToWorld(point) {
        return point.translate(-this.rect.left, -this.rect.top)
            .multiplyScalar(1 / this.settings.graph.zoom)
            .translate(this.tab.scrollLeft, this.tab.scrollTop)
           
    }
    center(items=this.getNodeArray()) {
        let n = items.length || items.size, pos = new Point(),p=new Point();
        if (!n) return pos;

        for (let node of items) pos.add(node.anchor(p));
        return pos.multiplyScalar(1 / n);
    }

    positionNodes() {
        this.classList.add("hide");
        this.querySelectorAll("graph-node").forEach(node => {
            this.positionFunction(this.tab, node);
        });
        this.classList.remove("hide");
    }

    hide(flag) {
        this.classList.toggle("hide", flag);
    }

    connectedCallback() {
        this.rect = this.getBoundingClientRect();
    }
    get viewRect() {
        return {
            x: this.tab.scrollLeft,
            y: this.tab.scrollTop,
            width: this.rect.width / this.settings.graph.zoom,
            height: this.rect.height /this.settings.graph.zoom
        }
    }

    delete() {
        this.sizeObserver.disconnect();
        this.remove();
    }

}

customElements.define("graph-tab", Tab);