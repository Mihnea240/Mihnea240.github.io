
const _edge_template = /* html */`
    <style>
        :host{
            position: absolute;
            width: 100%;height: 100%;
        }
    </style>
`

class edgeUI extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _edge_template;

        this.curves = [];
        let newCurve = document.createElement("curved-path");
        newCurve.fromCoords.set(10, 100);
        newCurve.toCoords.set(100, 500);
        newCurve.update();
        shadow.appendChild(newCurve);
    }

    connectedCallback() {
    }
}

customElements.define("graph-edge", edgeUI);


const _curve_template =/* html */`
     <style>
        :host{
            position: absolute;
            width: inherit; height: inherit
        }
        svg{
            width: 100%;height: 100%;
        }

        path,line{
            fill: none;
            stroke: white;
            stroke-width: 2px;
        }
        .hit-area{
            stroke-width: 10px;
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
        }
    </style>

    <div class="point" draggable="false"></div>
    <div class="point" draggable="false"></div>
    <svg>
        <path class="visible"/>
        <path class="hit-area"/>
        <line/>
        <line/>
    </svg>


`

class BezierCurve extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _curve_template;
        this.selected = false;

        this.fromCoords = new Point();
        this.toCoords = new Point();

        [this.p1, this.p2] = shadow.querySelectorAll("div");
        [this.l1, this.l2] = shadow.querySelectorAll("line");
        console.log(shadow.querySelectorAll("div"));
        this.paths = shadow.querySelectorAll("path");
        this.p1.pos = new Point();
        this.p2.pos = new Point();

        addCustomDrag(this.p1, {
            onmove: (ev, delta) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();
                this.p1.pos.translate(delta.x, delta.y);
                this.p1.style.cssText += `left: ${this.p1.pos.x}px; top: ${this.p1.pos.y}px;`
                this.update();
            }
        })
        addCustomDrag(this.p2, {
            onmove: (ev, delta) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();
                this.p2.pos.translate(delta.x, delta.y);
                this.p2.style.cssText += `left: ${this.p2.pos.x}px; top: ${this.p2.pos.y}px;`
                this.update();
            }
        })
    }

    update() {
        let new_val = `M ${this.fromCoords.x} ${this.fromCoords.y} C${this.p1.pos.x} ${this.p1.pos.y}, ${this.p2.pos.x} ${this.p2.pos.y}, ${this.toCoords.x} ${this.toCoords.y}`;
        this.paths.forEach(p => p.setAttribute("d", new_val));

        this.l1.setAttribute("x1", this.fromCoords.x);
        this.l1.setAttribute("y1", this.fromCoords.y);
        this.l1.setAttribute("x2", this.p1.pos.x);
        this.l1.setAttribute("y2", this.p1.pos.y);

        this.l2.setAttribute("x1", this.toCoords.x);
        this.l2.setAttribute("y1", this.toCoords.y);
        this.l2.setAttribute("x2", this.p2.pos.x);
        this.l2.setAttribute("y2", this.p2.pos.y);

    }
    set from(position) {
        this.p1.translate(position.x - this.fromCoords.x, position.y - this.fromCoords.y);
        this.fromCoords.translate(position.x, position.y);
        this.update();
    }
    get from(){return this.fromCoords}
    set to(position) {
        this.p2.translate(position.x - this.fromCoords.x, position.y - this.fromCoords.y);
        this.toCoords.translate(position.x, position.y);
        this.update();
    }
    get to() { return this.toCoords };

}

customElements.define("curved-path", BezierCurve);