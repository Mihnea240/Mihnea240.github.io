
const _edge_template = /* html */`
    <style>
        :host{
            position: absolute;
            width: 10%;height: 10%;
        }
        :host(:--selected) curved-path::part(svg){
            filter:drop-shadow(0 0 .5rem var(--graph-color));
        }
    </style>
`

class edgeUI extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _edge_template;
        this._internals = this.attachInternals();

        shadow.appendChild(this.curve = document.createElement("curved-path"));

        [this.graphId, this.fromNode, this.toNode] = this.id.slice(1).split(" ").map((el) => parseInt(el));

        this.addEventListener("contextmenu", (ev) => {
            ev.preventDefault();
            this.selected = !this.selected;
            console.log(this);
        })

    }

    update() {
        for (let c of this.curves) c.update();
    }
    lineView() {
        this.curve.p1.set(...this.curve.from);
        this.curve.p2.set(...this.curve.from);
    }

    set from(point) {
        this.curve.from = point;
    }
    get from() {
        this.curve.from;
    }
    set to(point) {
        this.curve.to = point;
    }
    get to() {
        return this.curve.to;
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
    get selected() { return this._internals.states.has("--selected"); }

    connectedCallback() {
        if (graphs.get(this.graphId).type == ORDERED) this.curve.addArrow();
    }
}

customElements.define("graph-edge", edgeUI);


const _curve_template =/* html */`
     <style>
        :host{
            position: absolute;
        }
        .hide{visibility: hidden};
        svg,path{
            position: absolute;
        }

        .curve path,.curve line{
            fill: none;
            stroke: var(--edge-color);
            z-index: 200;
        }
        .visible{
            stroke-width: var(--edge-width);
        }
        .hit-area{
            stroke-width: calc(5*var(--edge-width));
            stroke-opacity: 0;
            z-index: 11;
        }
        .hit-area:hover{
            stroke-opacity: 0.4;
            cursor: pointer;
        }
        .point{
            position: absolute;
            width: var(--point-width, 10px);
            aspect-ratio: 1;
            background-color: var(--edge-color);
            border-radius: 100%;
            transform: translate(-50%,-50%) rotate(90deg);
            user-select:none;

            outline: 2px solid gray;
            outline-offset: calc(var(--point-width,10px)/-3);
            z-index: 101;
        }
        .arrow{
            position: absolute;
            fill: var(--arrow-color,var(--edge-color));
            width: calc(15px + 0.8*var(--edge-width));
            aspect-ratio:1;
            overflow: visible;
        }
    </style>

    <div class="point" draggable="false"></div>
    <div class="point" draggable="false"></div>
    <svg class="curve" draggable="false" fill="none" overflow="visible" part="svg">
        <path class="visible"/>
        <path class="hit-area"/>
        <line/>
        <line/>
    </svg>
`

class BezierCurve extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _curve_template;

        this.fromCoords = new Point();
        this.toCoords = new Point();

        [this.p1, this.p2] = shadow.querySelectorAll("div");
        [this.l1, this.l2] = shadow.querySelectorAll("line");

        this.paths = shadow.querySelectorAll("path");
        this.p1.pos = new Point();
        this.p2.pos = new Point();
        this.offset = 0;

        shadow.querySelector("svg").oncontextmenu = (ev) => {
            ev.preventDefault();
            this.selected = !this.selected;
        }

        addCustomDrag(this.p1, {
            onmove: (ev, delta) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();
                this.p1.pos.translate(delta.x, delta.y);
                this.update();
            }
        })
        addCustomDrag(this.p2, {
            onmove: (ev, delta) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();
                this.p2.pos.translate(delta.x, delta.y);
                this.update();
            }
        })
        this.selected = false;
    }

    update() {
        this.classList.toggle("hide");
        let new_val = `M ${this.fromCoords.x} ${this.fromCoords.y} C${this.p1.pos.x} ${this.p1.pos.y}, ${this.p2.pos.x} ${this.p2.pos.y}, ${this.toCoords.x} ${this.toCoords.y}`;
        this.paths.forEach(p => p.setAttribute("d", new_val));
        this.p1.style.cssText += `left: ${this.p1.pos.x}px; top: ${this.p1.pos.y}px;`
        this.p2.style.cssText += `left: ${this.p2.pos.x}px; top: ${this.p2.pos.y}px;`


        this.l1.setAttribute("x1", this.fromCoords.x);
        this.l1.setAttribute("y1", this.fromCoords.y);
        this.l1.setAttribute("x2", this.p1.pos.x);
        this.l1.setAttribute("y2", this.p1.pos.y);

        this.l2.setAttribute("x1", this.toCoords.x);
        this.l2.setAttribute("y1", this.toCoords.y);
        this.l2.setAttribute("x2", this.p2.pos.x);
        this.l2.setAttribute("y2", this.p2.pos.y);

        if (this.arrow) {
            let middle = this.f(0.5), slope = this.df(0.5);
            this.arrow.style.cssText =
                `left: ${middle.x}px; top: ${middle.y}px; 
            transform-origin: 0 0;
            transform: rotate(${Math.atan2(slope.y, slope.x) * Math.rad2Deg}deg) translate(-50%,-50%);`;
        }
        this.classList.toggle("hide");
    }

    set from(position) {
        this.p1.pos.translate(position.x - this.fromCoords.x, position.y - this.fromCoords.y);
        this.fromCoords.set(position.x, position.y);
        this.update();
    }
    get from() { return this.fromCoords }
    set to(position) {
        this.p2.pos.translate(position.x - this.toCoords.x, position.y - this.toCoords.y);
        this.toCoords.set(position.x, position.y);
        this.update();
    }
    get to() { return this.toCoords };

    set selected(flag) {
        this.select = !!flag;
        this.p1.classList.toggle("hide", !flag);
        this.l1.classList.toggle("hide", !flag);
        this.p2.classList.toggle("hide", !flag);
        this.l2.classList.toggle("hide", !flag);
    }
    get selected() { return this.select }


}

customElements.define("curved-path", BezierCurve);