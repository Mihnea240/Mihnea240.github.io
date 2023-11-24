
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
        :host(:--selected) div{
            box-shadow:
                0 0 .5rem var(--graph-color),
                0 0 .3rem var(--graph-color) inset

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
        this._internals = this.attachInternals();

        let ids = this.id.split(' ');
        this.nodeId = parseInt(ids[1]);
        this.graphId = parseInt(ids[0].slice(1));

       this.oncontextmenu = (ev) => ev.preventDefault();
    }
    set selected(flag) {
        if (flag) {
            this._internals.states.add("--selected");
            graphs.get(this.graphId).selection.add(this);
        } else {
            this._internals.states.delete("--selected");
            graphs.get(this.graphId).selection.delete(this);
        }
    }
    get selected() {return this._internals.states.has("--selected");}

    initCurve() {
        this.parentElement.curve.classList.remove("hide");
        this.parentElement.curve.from = this.parentElement.curve.to = this.middle();
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
        this.parentElement.recalculateEdges(this.nodeId, this.middle());
    }

    connectedCallback() {
        this.parentRect = this.getBoundingClientRect(this.parentElement);
        this.css = getComputedStyle(this);
        this.main.innerHTML = this.nodeId;
    }
}

customElements.define("graph-node", nodeUI);