
const _node_template = /* html */`
    <style>
        :host{
            position: absolute;
            z-index: 100;
        }
        div{
            color: var(--node-color);
            border: var(--node-border);
            display: grid;
            place-content: center;
            user-select: none;
        }
        .hide{
            display: none;
        }
        [name="id"]{
            width: var(--node-width);
            height: var(--node-height);
            border-radius: var(--node-border-radius);
            background: var(--node-background);
            
        }



    </style>
    <div name="id" data-state="main"></div>
`

class nodeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;
        this.main = shadow.querySelector("[data-state='main']");
        this.pos = new Point();
        this.onmove = _ => true;
        this.new_node_protocol = false;

        let ids = this.id.split('_');
        this.nodeId = parseInt(ids[1]);
        this.graphId = parseInt(ids[0].slice(1));


        addCustomDrag(this, {
            onstart: (ev) => {
                ev.stopPropagation();ev.preventDefault();
                if (ev.buttons == 2) {
                    this.initCurve();
                    let p = new Point();
                    this.parentElement.relativePosition(p.set(ev.clientX, ev.clientY));
                    this.parentElement.curve.to = p;
                }
                return true;
            },
            onmove: (ev, delta) => {
                
                switch (ev.buttons) {
                    case 1: {
                        this.position(this.pos.x + delta.x, this.pos.y + delta.y);
                        break;
                    }
                    case 2: {
                       
                        this.parentElement.curve.toCoords.translate(delta.x, delta.y);
                        this.parentElement.curve.p2.pos.translate(delta.x, delta.y);
                        this.parentElement.curve.update();
                    } 
                }
                
            },
            onend: (ev) => {
                if (this.new_node_protocol) {
                    this.new_node_protocol = false;
                    this.parentElement.curve.classList.add("hide");
                    let graph = graphs.get(this.graphId)

                    if (ev.target.tagName == "GRAPH-NODE") {
                        graph.addEdge(this.nodeId, ev.target.nodeId);
                    } else {
                        let newNode = graph.addNode(), p = new Point(ev.clientX, ev.clientY);
                        this.parentElement.relativePosition(p);
                        newNode.position(p.x, p.y);
                        graph.addEdge(this.nodeId,newNode.nodeId);
                    }
                    
                    

                }
            }
        })

        this.oncontextmenu = (ev) => {
            ev.preventDefault();
        }
    }

    initCurve() {
        this.parentElement.curve.classList.remove("hide");
        this.parentElement.curve.from = this.middle();
        this.parentElement.curve.to = this.middle();
        this.new_node_protocol = true;
    }
    middle(x=0.5,y=0.5) {
        return new Point(
            this.pos.x + parseFloat(this.css.width)  * x,
            this.pos.y + parseFloat(this.css.height) * y
        );   
    }

    position(x, y) {
        this.pos.set(x,y);
        this.style.cssText += `left: ${this.pos.x}px; top: ${this.pos.y}px`;
        this.onmove(this.nodeId, this.middle());
    }

    connectedCallback() {
        this.parentRect = this.getBoundingClientRect(this.parentElement);
        this.css = getComputedStyle(this);
        this.main.innerHTML = this.nodeId;
    }
}

customElements.define("graph-node", nodeUI);