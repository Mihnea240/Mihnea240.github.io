
const _tab_template =/*html*/`
    <div class="tab" name="tab">
        <div id="square" draggable="false"></div>
        <div id="selectionRect"></div>
        <curved-path mode="absolute" class="hide" style="position: absolute"></curved-path>
        <slot name="edges"></slot>
        <slot name="nodes"></slot>

    </div>
    <list-view autofit="true" autoflow="true" direction="row"></list-view>
    <list-view autofit="true" autoflow="true" direction="column"></list-view>
`
class Tab extends HTMLElement {
    static dragHandle = {
        point: new Point(),
        rect: {},
        visibleItems: undefined,
        timer: 12,
        timerMax: 12,
        tab: undefined,
        minDraddistanceSquared: 7, 
        nodeDragStart(target, ev) {
        },
        edgeDragStart(target,ev) {
        },
        tabDragStart(target,ev) {
            if (ev.buttons != 2) return;
            target.screenToWorld(target.selectionRect.pos.set(ev.clientX, ev.clientY));
            ev.stopPropagation();
        },
        tabDrag(target, ev, delta){
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
                let { x, y } = target.screenToWorld(this.point.set(ev.clientX, ev.clientY));
                let p = target.selectionRect.pos.clone();
                if (x < p.x) [this.point.x, p.x] = [p.x, this.point.x];
                if (y < p.y) [this.point.y, p.y] = [p.y, this.point.y];
                
                x = Math.abs(this.point.x - p.x);
                y = Math.abs(this.point.y - p.y);
               
                target.selectionRect.style.cssText += `
                    left: ${p.x}px;
                    top: ${p.y}px;
                    width: ${x}px;
                    height: ${y}px;
                    display: block;
                `
                if (this.timer < 0) this.timer = this.timerMax;
                else return this.timer--;
    
                this.rect.x = p.x; this.rect.y = p.y;
                this.rect.width = x; this.rect.height = y
                
                this.visibleItems ||= visibleElements(target.getGraph());
                
                for (let [el, rect] of this.visibleItems) {
                    el.selected = AABB(this.rect, rect);
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
                if (this.visibleItems) {
                    ev.stopPropagation(); 
                    
                    let sel = target.getGraph().selection;
                    for (let [el,rect] of this.visibleItems) sel.toggle(el, el.selected);
    
                    this.visibleItems = undefined;
                    target.selectionRect.style.display = "none";
                }
            }
        },
        nodeDrag(target, ev, delta) {
            if (target.focused) return;
            delta.multiplyScalar(1 / target.parentElement.zoom);
            if (ev.ctrlKey) {
                for (let n of target.getGraph().selection.nodeSet) {
                    n.translate(delta.x, delta.y);
                    n.transform.velocity.copy(appData.cursorVelocity);
                }
                return;
            }
            switch (ev.buttons) {
                case 1: target.translate(delta.x, delta.y); break;
                case 2: {
                    if (!this.fromNode) this.initCurve(target)
                    this.tab.curve.translateTo(delta);
                    break;
                } 
                default: return;
            }
            
            target.active = true;
        },
        nodeDragEnd(originalNode, ev) {
            originalNode.transform.velocity.copy(appData.cursorVelocity);
            originalNode.active = false;

            if (!this.fromNode) return;
            if (ev.target.matches("graph-node")) {
                ev.stopImmediatePropagation();
                this.initCurve()
                return Graph.get(originalNode.graphId).addEdge({ from: originalNode.nodeId, to: ev.target.nodeId });
            }
            
            this.tab.screenToWorld(this.point.set(ev.clientX, ev.clientY));
            this.addNewConnection(this.fromNode.nodeId, this.point);
            ev.stopPropagation();
            this.initCurve();
        },
        edgeDrag(target, ev, delta){
            if (ev.button) return ev.stopPropagation();
            if (!this.fromNode && delta.magSq() > this.minDraddistanceSquared) {
                this.initCurve(this.tab.getGraph().getNodeUI(target.from));
                this.tab.screenToWorld(this.point.set(ev.clientX, ev.clientY));
                this.tab.curve.toPosition(this.point, false);
                target.classList.add("hide");
            }
            delta.multiplyScalar(1 / this.tab.zoom);
            this.tab.curve.translateTo(delta);
        },
        edgeDragEnd(originalEdge,ev){
            if (!this.fromNode) return;
    
            let graph = Graph.get(originalEdge.graphId);
    
            if (ev.target.matches("graph-node")) {
                if (ev.target.nodeId != originalEdge.to) graph.addEdge({ from: this.fromNode.nodeId, to: ev.target.nodeId });
                else originalEdge.classList.remove("hide");
            } else {
                this.tab.screenToWorld(this.point.set(ev.clientX, ev.clientY));
                this.addNewConnection(this.fromNode.nodeId, this.point);
                graph.removeEdge(originalEdge.from, originalEdge.to);
            }
            this.initCurve();
        },
        addNewConnection(from,{x,y}) {
            let g = this.tab.getGraph();
            g.actionsStack.startGroup();

            let newNode = g.addNode();
            newNode.position(x, y);
            g.addEdge({ from, to: newNode.nodeId });

            g.actionsStack.endGroup();
        },
        initCurve(node) {
            if (!node) {
                this.tab.curve.classList.add("hide");
                this.fromNode = undefined;
                return;
            }
            this.fromNode = node;
            this.tab.curve.classList.remove("hide");
            let p = node.anchor();
            this.tab.curve.fromPosition(p);
            this.tab.curve.toPosition(p);
        }
    
    }
    static PositionFunctons = {
        randomScreen: (graph_tab, node, recalculateEdges) => {
            let rect = graph_tab.viewRect;
            if (!rect) return;
            let width = random(0, rect.width);
            let height = random(0, rect.height);
    
            node.position(rect.x + width, rect.y + height, recalculateEdges);
        }
    }

    static sizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target.matches("graph-node")) {
                entry.target.transform.size.set(entry.borderBoxSize[0].inlineSize, entry.borderBoxSize[0].blockSize);
                entry.target.closest("graph-tab").recalculateEdges(entry.target.nodeId,entry.target.anchor());
            }else entry.target.size.set(entry.borderBoxSize[0].inlineSize, entry.borderBoxSize[0].blockSize);

        }
    })

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _tab_template;
        shadow.adoptedStyleSheets = [GraphTemplate.styleSheet];

        this.square = shadow.getElementById("square");
        this.css = getComputedStyle(this);
        this.tab = this.shadowRoot.querySelector("div");
        this.curve = shadow.querySelector("curved-path");
        this.positionFunction = Tab.PositionFunctons.randomScreen;
        this.graphId = parseInt(this.id.slice(1));
        this.zoom = 1;

        this.size = new Point();
        Tab.sizeObserver.observe(this);

        this.selectionRect = shadow.querySelector("#selectionRect");
        this.selectionRect.pos = new Point();

        let evTarget;
        addCustomDrag(this, {
            onstart: (ev) => {
                Tab.dragHandle.tab = this;
                evTarget = ev.target;
                switch (ev.target.tagName) {
                    case "GRAPH-EDGE": Tab.dragHandle.edgeDragStart(evTarget,ev); break;
                    case "GRAPH-NODE": Tab.dragHandle.nodeDragStart(evTarget, ev); break;
                    case "GRAPH-TAB": Tab.dragHandle.tabDragStart(evTarget,ev); break;    
                }
                return true;
            },
            onmove: (ev, delta) => {
                switch (evTarget.tagName) {
                    case "GRAPH-TAB": Tab.dragHandle.tabDrag(this, ev, delta); break;
                    case "GRAPH-NODE": Tab.dragHandle.nodeDrag(evTarget, ev, delta); break;
                    case "GRAPH-EDGE": Tab.dragHandle.edgeDrag(evTarget, ev, delta); break;
                }
                
            },
            onend: (ev) => {
                switch (evTarget.tagName) {
                    case "GRAPH-NODE": Tab.dragHandle.nodeDragEnd(evTarget, ev); break;
                    case "GRAPH-EDGE": Tab.dragHandle.edgeDragEnd(evTarget, ev); break;
                    case "GRAPH-TAB": Tab.dragHandle.tabDragEnd(evTarget, ev); break;
                }
            }
        })
        
        this.addEventListener("mouseup", (ev) => {
            if (ev.target.matches("graph-tab")) {
                if (ev.button !== 2) Graph.get(this.graphId).selection.clear();
                else openActionMenu(ev);

                if (this.curvesArray.size) {
                    for (let c of this.curvesArray) c.active = false
                    this.curvesArray.clear();
                }
            } else { 
                if (ev.detail == 2) return inspector.observe(ev.target);
                if (ev.button == 2 && ev.target.matches("graph-node")  ) this.getGraph().selection.toggle(ev.target);
                else if (ev.target.matches("graph-edge")) {
                    if (ev.button == 2) this.getGraph().selection.toggle(ev.target);
                    else if (!ev.composedPath()[0].matches(".point")) ev.target.active = !ev.target.active;
                }
            }
        })

        shadow.querySelectorAll("list-view").forEach(list => list.target = this.tab);
        this.addEventListener("keydown", (ev) => {
            if (ev.target.matches("graph-node,graph-edge")) ev.stopPropagation(), ev.stopImmediatePropagation();
        },true)

        
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
            this.screenToWorld(lastPointer.set(ev.clientX,ev.clientY));

            this.zoom += ev.deltaY < 0 ? -scale : scale;
            if (zoom < 0.1) this.zoom = scale;
            
            this.getGraph().settings.zoom = this.zoom;
            this.screenToWorld(currentPointer.set(ev.clientX, ev.clientY));

            this.classList.add("hide");
            for (let n of this.getNodeArray()) n.translate(currentPointer.x - lastPointer.x, currentPointer.y - lastPointer.y);

            this.classList.remove("hide");
            
        })

        this.curvesArray = new Set();
        this.addEventListener("curveselect", (ev) => {
            if (ev.target.active) this.curvesArray.add(ev.target);
        })
    }

    set template(string) {this.setAttribute("template", string);}
    get template() { return this.getAttribute("template"); }

    toggleRuler(value) {
        this.shadowRoot.querySelectorAll("list-view").forEach(list => list.classList.toggle("hide", !value));
    }

    focus(pos) {
        if (pos === undefined) {
            let selectedNodes = this.getGraph().selection.nodeSet;
            if (selectedNodes.size !== 0) pos = this.center(selectedNodes);
            else pos = this.center();
        }

        let newPos = new Point();
        if (this.rect) {
            let rect = this.square.getBoundingClientRect();
            newPos=newPos.copy(pos).translate(this.rect.width / 2, this.rect.height / 2);
            if (rect.width < newPos.x || rect.height < newPos.y) this.canvasSize(newPos.x, newPos.y);
        }
        
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
        if (UI.inspector.observed?.nodeId == nodeId) UI.inspector.observe();
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
        Tab.sizeObserver.observe(newNode);
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
        let template = EdgeTemplate.get(edge.template);
        
        edge.init(props, n1.anchor(), n2.anchor(), false);
        
        if (type == Graph.ORDERED) {
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
        if (type === Graph.UNORDERED && x > y) [x, y] = [y, x]; 
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
        return point.translate(-this.rect.left,-this.rect.top).multiplyScalar(1 / this.zoom).translate(this.tab.scrollLeft, this.tab.scrollTop)
           
    }
    center(items=this.getNodeArray()) {
        let n = items.length || items.size, pos = new Point(),p=new Point();
        if (!n) return pos;

        for (let node of items) pos.add(node.anchor(p));
        return pos.multiplyScalar(1 / n);
    }

    positionNodes() {
        this.classList.add("hide");
        this.getNodeArray().forEach((node) => this.positionFunction(this, node));
        this.classList.remove("hide");
    }

    hide(flag) {
        this.classList.toggle("hide", flag);
    }

    connectedCallback() {
        setTimeout(() => { this.rect = this.getBoundingClientRect(); }, 100);
    }
    get viewRect() {
        return {
            x: this.tab.scrollLeft,
            y: this.tab.scrollTop,
            width: this.size.x / this.zoom,
            height: this.size.y /this.zoom
        }
    }

    delete() {
        this.getNodeArray().forEach((n) => Tab.sizeObserver.unobserve(n));
        this.remove();
    }

}

customElements.define("graph-tab", Tab);