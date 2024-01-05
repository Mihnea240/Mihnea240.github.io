
const _node_template = /* html */`
    <style>
        :host{
            position: absolute;
            z-index: 100;
        }
        div{
            color: var(--node-color);
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
            border: var(--node-border-width) var(--node-border-style) var(--node-border-color);
            background: var(--node-background);
            font-size: calc(var(--node-width) * 0.5); 
        }
        :host(:--selected) div{
            box-shadow:
                0 0 var(--node-emission) var(--graph-main-color),
                0 0 calc(var(--node-emission) *0.9) var(--graph-main-color) inset;
        }



    </style>
    <div name="id" data-state="main"></div>
`.trim();

class NodeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;
        this.main = shadow.querySelector("[data-state='main']");
        this.transform=new Transform();
        /* this.pos = new Point();
        this.size = new Point(38, 38); */
        this.onmove = _ => true;
        this.new_node_protocol = false;
        this._internals = this.attachInternals();

        let ids = this.id.split(' ');
        this.nodeId = parseInt(ids[1]);
        this.graphId = parseInt(ids[0].slice(1));

       this.oncontextmenu = (ev) => ev.preventDefault();
    }
    set selected(flag) {
        if (flag)this._internals.states.add("--selected");
        else this._internals.states.delete("--selected");
    }
    get selected() {return this._internals.states.has("--selected");}

    initCurve() {
        this.parentElement.curve.classList.remove("hide");
        this.parentElement.curve.from = this.parentElement.curve.to = this.middle();
        this.new_node_protocol = true;
    }


    middle(x = 0.5, y = 0.5) {
        return new Point(
            this.transform.position.x + this.transform.size.x * x,
            this.transform.position.y + this.transform.size.y * y
        );   
    }

    position(x, y , updateEdges=true) {
        this.transform.position.set(x,y);
        this.update(updateEdges);
    }
    translate(x,y,update=true) {
        this.transform.position.translate(x, y);
        this.update(update);
    }
    update(updateEdges=true) {
        this.style.cssText += `left: ${this.transform.position.x}px; top: ${this.transform.position.y}px`;
        if(updateEdges)this.parentElement.recalculateEdges(this.nodeId, this.middle());
    }

    focus() {
        this.parentElement.focus(this.transform.position);
    }

    connectedCallback() {
        this.parentRect = this.getBoundingClientRect(this.parentElement);
        //this.css = getComputedStyle(this);
        this.main.innerHTML = this.nodeId;
    }
}

customElements.define("graph-node", NodeUI);