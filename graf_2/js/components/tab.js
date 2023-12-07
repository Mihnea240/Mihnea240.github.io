
const _tab_template =/*html*/`
    <style>
        :host{
            position: absolute;
            width: 100%;  height:100%;
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
            font-size: 10px;
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
        <slot></slot>
  
    </div>
    <number-line unit="100px" for="tab"></number-line>
    <number-line unit="100px" direction="vertical" for="tab"></number-line>
    
`

const PositionFunctons = {
    randomScreen: (graph_tab, node) => {
        let x_off = graph_tab.scrollLeft;
        let y_off = graph_tab.scrollTop;
        let width = random(0, parseFloat(graph_tab.css.width));
        let height = random(0, parseFloat(graph_tab.css.height));

        node.position(x_off + width, x_off + height);
    }
}
const storage = {
    point: new Point(),
}
const dragHandle = {
    
    tabDrag: (target, delta) => {
        let rect = target.square.getBoundingClientRect();
        let dx = rect.width - delta.x;
        let dy = rect.height - delta.y;

        target.square.style.cssText += `width: ${dx}px; height: ${dy}px`;
        
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
                let newNode = graph.addNode(), p = new Point(ev.clientX, ev.clientY);
                originalNode.parentElement.relativePosition(p);
                newNode.position(p.x, p.y);
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
            tab.relativePosition(storage.point.set(ev.clientX, ev.clientY));
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
                originalEdge.parentElement.relativePosition(storage.point.set(ev.clientX, ev.clientY));
                newNode.position(storage.point.x, storage.point.y);
                graph.addEdge(storage.fromNode.nodeId, newNode.nodeId);
            }
            
            graph.removeEdge(originalEdge.fromNode, originalEdge.toNode);
            storage.fromNode = undefined;
        } else if (ev.button == 2) {
            console.log(ev.target);
            console.log(graphs.get(ev.target.graphId).selection.toggle(ev.target));
            
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
        this.positionFunction = PositionFunctons.randomScreen;
        this.graphId = parseInt(this.id.slice(1));

        let evTarget;
        addCustomDrag(this, {
            onstart: (ev) => {
                evTarget = ev.target;
                if (ev.target.tagName === "GRAPH-EDGE") {
                    storage.fromNode = this.getNode(ev.target.fromNode);
                }
                return true;
            },
            onmove: (ev, delta) => {
                switch (evTarget.tagName) {
                    case "GRAPH-TAB": dragHandle.tabDrag(this, delta); break;
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
            console.log(ev.target);
            if (ev.target.tagName !== "GRAPH-NODE" && ev.target.tagName !== "GRAPH-EDGE") {
                let selection = graphs.get(this.graphId).selection;
                if(!selection.empty())selection.clear();
            }
        })

        let zoom = 1, scale=0.1;
        this.addEventListener("wheel", (ev) => {
           /*  zoom += ev.deltaY < 0 ? - scale : scale;
            if (zoom < 0) zoom = scale;
            this.style.scale = zoom; */
        })
    }

    recalculateEdges(nodeId, point) {
        this.connectedEdges(nodeId).forEach((ed) => {
            if (ed.fromNode === nodeId) ed.from = point;
            else if (ed.toNode === nodeId) ed.to = point;
        })
    }
    connectedEdges(nodeId) {
        return this.querySelectorAll(`graph-edge[id~='${nodeId}']`);
    }
    getNode(id) {
        return document.getElementById("g" + this.graphId + " " + id);
    }
    getEdge(x, y) {
        return document.getElementById("g" + this.graphId + " " + x + " " + y);
    }

    relativePosition(point) {

        point.translate(this.tab.scrollLeft - this.rect.left, this.tab.scrollTop - this.rect.top);
    }

    positionNodes() {
        this.classList.add("hide");
        this.querySelectorAll("graph-node").forEach(node => {
            this.positionFunction(this.tab, node);
        });
        this.classList.remove("hide");
    }

    connectedCallback() {
        this.rect = this.getBoundingClientRect();
    }

}

customElements.define("graph-tab", Tab);