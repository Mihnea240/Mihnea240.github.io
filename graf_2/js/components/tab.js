
const _tab_template =/*html*/`
    <style>
        :host{
            position: absolute;
            width: 100%;  height:100%;
            zoom: 1;
        }
        #square{
            position: absolute;
            width: 100%;  height:100%;
            background-color: transparent;
            pointer-events:none;
            user-select: none;
            z-index: -1;
        }
        .tab{
            position: absolute;
            overflow: scroll;
            width: 100%;  height:100%;
            background: inherit;
            z-index: -1;
        }
        ::-webkit-scrollbar{
            background-color: inherit;
            width: 12px;    height: 12px;
            z-index: 5;
        }
        ::-webkit-scrollbar-corner{

        }
        ::-webkit-scrollbar-thumb{
            background-color: rgba(0, 0, 0, 0.47);
            border-radius: .2em;
        }
        .hide{display: none}
        number-line{
            position: absolute; z-index:10;
            font-size: 1rem;
            border: .1px solid white;
        }
        number-line[direction="horizontal"]{
            bottom: 0; left:0;
        }
        number-line[direction="vertical"]{
            right: 0; top:0;
        }
    </style>

    
    
    <div class="tab" name="tab">
        <div id="square" draggable="false"></div>
        <curved-path class="hide" style="position: absolute"></curved-path>
        <slot name="nodes"></slot>
        <slot name="edges"></slot>
  
    </div>
    <number-line unit="100px" for="tab"></number-line>
    <number-line unit="100px" direction="vertical" for="tab"></number-line>
    
`

const PositionFunctons = {
    randomScreen: (graph_tab, node) => {
        let x_off = graph_tab.tab.scrollLeft;
        let y_off = graph_tab.tab.scrollTop;
        let width = random(0, parseFloat(graph_tab.css.width));
        let height = random(0, parseFloat(graph_tab.css.height));

        node.position(x_off + width, y_off + height);
    }
}
const storage = {
    point: new Point(),
}
const dragHandle = {
    
    tabDrag: (target, ev, delta) => {
        if (ev.buttons == 4) {
            ev.preventDefault();
            let g = target.getGraph();
            for (let n of g.selection.nodeSet) {
                n.position(n.pos.x + delta.x, n.pos.y + delta.y);
            }
            return;
        }

        let rect = target.square.getBoundingClientRect();
        storage.point.set(rect.width - delta.x, rect.height - delta.y);

        target.square.style.cssText += `width: ${storage.point.x}px; height: ${storage.point.y}px`;
        
        target.tab.scrollBy(-delta.x, -delta.y);
    },
    nodeDrag: (target, ev, delta) => {
        switch (ev.buttons) {
            case 1: {
                target.position(target.pos.x + delta.x, target.pos.y + delta.y);
                break;
            }
            case 2: {
                if (target.new_node_protocol == false) target.initCurve();
                let c = target.parentElement.curve;
                c.toCoords.translate(delta.x, delta.y);
                c.p2.pos.translate(delta.x, delta.y);
                c.update();
            } 
        }
    },
    nodeDragEnd: (originalNode,ev) => {
        if (originalNode.new_node_protocol) {
            originalNode.new_node_protocol = false;
            originalNode.parentElement.curve.classList.add("hide");
            
            let graph = graphs.get(originalNode.graphId)

            if (ev.target.tagName == "GRAPH-NODE") {
                graph.addEdge(originalNode.nodeId, ev.target.nodeId);
            } else {
                let newNode = graph.addNode();
                storage.point.set(ev.clientX, ev.clientY);
                originalNode.parentElement.screenToWorld(storage.point);

                newNode.position(storage.point.x, storage.point.y);
                graph.addEdge(originalNode.nodeId, newNode.nodeId);
                ev.stopPropagation(); ev.stopImmediatePropagation();
                
            }
        } else if (ev.button == 2) {
            graphs.get(ev.target.graphId).selection.toggle(ev.target);
        }
    },
    edgeDrag: (target,ev,delta) => {
        let tab = target.parentElement, c = tab.curve;

        if (storage.fromNode.new_node_protocol == false) {
            target.classList.add("hide");
            storage.fromNode.initCurve();
            tab.screenToWorld(storage.point.set(ev.clientX, ev.clientY));
            c.to=storage.point;
        }
        c.toCoords.translate(delta.x, delta.y);
        c.p2.pos.translate(delta.x, delta.y);
        c.update();
    },
    edgeDragEnd: (originalEdge,ev) => {
        if (storage.fromNode?.new_node_protocol) {
            storage.fromNode.new_node_protocol = false;

            let graph = graphs.get(originalEdge.graphId);
            originalEdge.parentElement.curve.classList.add("hide");

            if (ev.target.tagName == "GRAPH-NODE") {
                console.log(ev.target, originalEdge.toNode);
                if (ev.target.nodeId != originalEdge.toNode) graph.addEdge(storage.fromNode.nodeId, ev.target.nodeId);
                else {
                    originalEdge.classList.remove("hide");
                    storage.fromNode = undefined;
                    return;
                }
            } else {
                let newNode = graph.addNode();
                originalEdge.parentElement.screenToWorld(storage.point.set(ev.clientX, ev.clientY));
                newNode.position(storage.point.x, storage.point.y);
                graph.addEdge(storage.fromNode.nodeId, newNode.nodeId);
            }
            
            graph.removeEdge(originalEdge.fromNode, originalEdge.toNode);
            storage.fromNode = undefined;
        } else if (ev.button == 2) {
            graphs.get(ev.target.graphId).selection.toggle(ev.target);

        } else if (ev.button == 0) {
            if (!ev.composedPath()[0].classList.contains("point"))
            originalEdge.curve.selected = !originalEdge.curve.selected;
        }
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
        this.curve.tf = BezierCurve.translationFunctions.absoluteTranslation;
        this.positionFunction = PositionFunctons.randomScreen;
        this.graphId = parseInt(this.id.slice(1));

        let evTarget;
        addCustomDrag(this, {
            onstart: (ev) => {
                evTarget = ev.target;
                if (ev.target.tagName === "GRAPH-EDGE") storage.fromNode = this.getNode(ev.target.fromNode);
                if (ev.buttons == 4 && ev.target.tagName === "GRAPH-NODE")ev.preventDefault(), evTarget = this;
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
                    
                }
            }

        })

        this.oncontextmenu = (ev) => ev.preventDefault()
        this.addEventListener("click", (ev) => {
            if (ev.target.tagName !== "GRAPH-NODE" && ev.target.tagName !== "GRAPH-EDGE") {
                let selection = graphs.get(this.graphId).selection;
                if (!selection.empty()) selection.clear();
            }
            if (ev.target.tagName !== "GRAPH-EDGE" && this.curvesArray.size) {
                for (let c of this.curvesArray) c.selected=false
                this.curvesArray.clear();
            }
        })

        this.zoom = 1;
        let scale = 0.1;
        let lastPointer = new Point();
        let currentPointer = new Point();
        let tabPos = new Point();
        
        this.addEventListener("wheel", (ev) => {
            ev.preventDefault();
            
            this.screenToWorld(lastPointer.set(ev.clientX,ev.clientY));

            this.zoom += ev.deltaY < 0 ? -scale : scale;
            if (this.zoom < 2 * scale) this.zoom = 2 * scale;
            
            this.screenToWorld(currentPointer.set(ev.clientX, ev.clientY));

            this.classList.add("hide");
            for (let n of this.children) {
                if (n.tagName === "GRAPH-NODE")
                    n.position(
                        n.pos.x + currentPointer.x - lastPointer.x,
                        n.pos.y + currentPointer.y - lastPointer.y
                    );
            }
        
            this.style.zoom = this.zoom;
            this.classList.remove("hide");
            
        })

        this.sizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                entry.target.size.x = entry.borderBoxSize[0].inlineSize;
                entry.target.size.y = entry.borderBoxSize[0].blockSize;
            }
        })

        this.curvesArray = new Set();
        this.addEventListener("curveselect", (ev) => {
            if (ev.detail.selected) this.curvesArray.add(ev.composedPath()[0]);
        })
    }

    recalculateEdges(nodeId, point) {

        this.forConnectedEdges(nodeId,(edge)=>{
            if (edge.fromNode === nodeId) edge.from = point;
            else if (edge.toNode === nodeId) edge.to = point;
        })
    }
    forConnectedEdges(nodeId,callBack) {
        let G=graphs.get(this.graphId);
        let neighbourSet = G.nodes.get(nodeId),e;

        for (let node of neighbourSet) {
            node = Math.abs(node);
            e = this.getEdge(node, nodeId);
            if (e) callBack(e);
            e = this.getEdge(nodeId, node);
            if (e) callBack(e);
        }
        //return this.querySelectorAll(`graph-edge[id~='${nodeId}']`);
    }
    getNode(id) {
        return document.getElementById("g" + this.graphId + " " + id);
    }
    getEdge(x, y) {
        return document.getElementById("g" + this.graphId + " " + x + " " + y);
    }
    getGraph() {
        return graphs.get(this.graphId);
    }

    /**@param {Point} point*/
    screenToWorld(point) {
        return point.translate(-this.rect.left, -this.rect.top)
            .multiplyScalar(1 / this.zoom)
            .translate(this.tab.scrollLeft, this.tab.scrollTop)
           
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

}

customElements.define("graph-tab", Tab);