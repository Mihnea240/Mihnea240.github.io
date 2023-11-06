
const _node_template = /* html */`
    <style>
        :host{
            position: absolute;
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
            width: var(--node-size);
            aspect-ratio: 1;
            border-radius: 50%;
            
        }



    </style>
    <div name="id" data-state="main"></div>
    <div class="hide" name="text"></div>
    <div class="hide" name="img"></div>
`

class nodeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;
        this.main=shadow.querySelector("[data-state='main']")
        this.pos = { x: 0, y: 0 };

        let offset = { x: 0, y: 0 };
        addCustomDrag(this, {
            onstart: (ev) => {
                ev.stopPropagation();
                if (ev.buttons != 1) return false;
                return true;
            },
            onmove: (ev, delta) => {
                this.position(this.pos.x + delta.x, this.pos.y + delta.y);
            }
        })
    }

    position(x,y) {
        this.pos = {x: x - this.parentRect.left, y: y};
        this.style.cssText += `left: ${this.pos.x}px; top: ${this.pos.y}px`;
    }
    connectedCallback() {
        this.parentRect = this.parentElement.rect;
    }

    connectedCallback() {
        let ids = this.id.split('_');
        this.nodeId = parseInt(ids[1]);
        this.graphId = parseInt(ids[0]);
        this.graph = graphs.get(graphId);
        this.main.innerHTML = this.nodeId;
    }
}

customElements.define("graph-node", nodeUI);