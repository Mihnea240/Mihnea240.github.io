
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
    randomScreen: (graph_tab,node) => {
        let x_off = graph_tab.scrollLeft;
        let y_off = graph_tab.scrollTop;
        let width = random(0, parseFloat(graph_tab.css.width));
        let height = random(0, parseFloat(graph_tab.css.height));

        node.position(x_off + width, x_off + height);
    }
}

class Tab extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML=_tab_template;

        this.square = shadow.getElementById("square");
        this.css = getComputedStyle(this);
        this.tab = this.shadowRoot.querySelector("div");
        this.curve = shadow.querySelector("curved-path");
        this.positionFunction = PositionFunctons.randomScreen;
        this.graphId = parseInt(this.id.slice(1));

        addCustomDrag(this, {
            onstart: (ev) => {
                let selection = graphs.get(this.graphId).selection;
                if (!selection.empty() && (ev.target.tagName !== "GRAPH-NODE" || ev.target.tagName !== "GRAPH-EDGE")) {
                    selection.clear();
                }
                return true;
            },
            onmove: (ev,delta)=>{
                let rect=this.square.getBoundingClientRect();
                let dx=rect.width -delta.x;
                let dy=rect.height-delta.y;

                this.square.style.cssText += `width: ${dx}px; height: ${dy}px`;
                this.tab.scrollBy(-delta.x, -delta.y);
            }
        })

        this.oncontextmenu = (ev)=>{
            //ev.preventDefault();
        }

        let slot = shadow.querySelector("slot");
        slot.addEventListener("slotchange", (ev) => {
            let newEl = slot.assignedNodes().back()
            if (newEl.tagName === "GRAPH-NODE") {
                this.positionFunction(this, newEl);
            }
        })
    }

    recalculateEdges(nodeId,point) {
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
    getEdge(x,y) {
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