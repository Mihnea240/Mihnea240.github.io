
const _edge_template = /* html */`
    <style>
        :host{
            position: absolute;
            width: 10%;height: 10%;
        }
    </style>
`

class edgeUI extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _edge_template;

        this.curves = [];

        this.curves[0] = document.createElement("curved-path");
        shadow.appendChild(this.curves[0]);

    }

    update() {
        for (let c of this.curves) c.update();
    }
    lineView() {
        this.curves[0].p1.set(...this.curves[0].from);
        this.curves[0].p2.set(...this.curves[1].from);
    }

    set from(point) {
        this.curves[0].from = point;
    }
    get from() { return this.curves[0].from }
    set to(point) {
        this.curves[0].to = point;
    }
    get to() { return this.curves[0].to }
    set selected(flag) {
        for (let c of this.curves) c.selected = !!flag;
    }
    get selected() { return this.select };

    connectedCallback() {
    }
}

customElements.define("graph-edge", edgeUI);


const _curve_template =/* html */`
     <style>
        :host{
            position: absolute;
        }
        .hide{display:none};
        svg{}

        path,line{
            fill: none;
            stroke: white;
            stroke-width: var(--edge-width);
        }
        .hit-area{
            stroke-width: calc(5 * var(--edge-width));
            stroke-opacity: 0;
        }
        .hit-area:hover{
            stroke-opacity: 0.3;
        }
        .point{
            position: absolute;
            width: var(--point-width, 10px);
            aspect-ratio: 1;
            background-color: var(--edge-color,red);
            z-index: 101;
        }
    </style>

    <div class="point" draggable="false"></div>
    <div class="point" draggable="false"></div>
    <svg width= "100%" height="100%" draggable="false" fill="none" overflow="visible">
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

        shadow.querySelector(".hit-area").onclick = (ev) => { this.selected = !this.selected, console.log(ev.target) };

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