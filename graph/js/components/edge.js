
const _edge_template = /* html */`
    <style>
        :host{
            position: absolute;
            pointer-events: stroke;
        }
        :host(.selected) {
            filter:
                drop-shadow(0 0 var(--edge-emission) var(--graph-main-color))
                drop-shadow(0 0 calc(var(--edge-emission)* .2) var(--graph-main-color))
                drop-shadow(0 0 calc(var(--edge-emission)* .1) var(--graph-main-color))
            ;
        }
    </style>
`.trim();

class EdgeUI extends HTMLElement {
    static observedAttributes = ["symmetry", "mode"];
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _edge_template;

        this.mode = "absolute";
        this.symmetry = true;
        this.from;
        this.to;
        this.graphId;
        this._selected = false;
        this._active = false;
        this.focused = false;
        this.custom = {};

        shadow.appendChild(this.curve = document.createElement("curved-path"));
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "symmetry") {
            let val = false;
            if (newValue == "true") val = true;
            else if (newValue == "false") val = false;
            else if (newValue) val = true;

            this.curve.symmetry = val;
            this.props.symmetry = val;
        }
        if (name == "mode") {
            if (newValue == "relative") this.curve.tf = BezierCurve.translationFunctions.relativeTranslation;
            else if (newValue == "absolute") this.curve.tf = BezierCurve.translationFunctions.absoluteTranslation;
            this.props.mode = newValue;
        }
    }

    update() {
        let n1 = this.parentElement.getNode(this.from), n2 = this.parentElement.getNode(this.to);
        this.curve.from = n1.anchor();
        this.curve.to = n2.anchor();
        this.curve.update();
    }
    init(props, type) {

        if (type === ORDERED) this.curve.addArrow();

        this.curve.p1.pos = this.props.p1;
        this.curve.p2.pos = this.props.p2;
    }
    initPos(v1, v2, offset1 = Point.ORIGIN, offset2 = offset1) {
        this.curve.fromCoords.copy(v1);
        if (this.props.p1.magSq() == 0) {
            this.props.p1.set(v1.x, v1.y);
            this.curve.lfrom.set(v1.x, v1.y);
        }
        this.curve.toCoords.copy(v2);
        if (this.props.p2.magSq() == 0) {
            this.props.p2.set(v2.x, v2.y);
            this.curve.lto.set(v2.x, v2.y);
        }
        this.curve.update();
    }

    getBoundingClientRect() {
        return this.curve.paths[0].getBoundingClientRect();
    }

    fromPosition(point) {
        if (!point) return this.curve.from;
        return this.curve.from = point
    }
    toPosition(point) {
        if (!point) return this.curve.to;
        return this.curve.from
    }

    set selected(flag) {
        this.classList.toggle("selected", flag);
        this._selected = flag;
    }
    get selected() { return this._selected }

    set active(flag) { this._active = this.curve.selected = flag }
    get active() { return this._active }


    data() {
        return {
            from: this.from,
            to: this.to,
            p1: this.p1,
            p2: this.p2,
            symmetry: this.symmetry,
            mode: this.mode,
        }
    }
}

customElements.define("graph-edge", EdgeUI);


const _curve_template =/* html */`
     <style>
        :host{
            position: absolute;
            
        }
        .hide{display: none};
        .curve,svg,path{
            position: absolute;
            pointer-events: stroke;
        }
        .curve path,.curve line{
            background-color: rgba(255,255,255);
            stroke: var(--edge-color);
        }
        .visible{
            stroke-width: var(--edge-width);
            z-index: 1;
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
    <svg class="curve" width="40" height="20" draggable="false" fill="none" overflow="visible" part="svg" >
        <path class="visible"/>
        <path class="hit-area" />
        <line/>
        <line/>
    </svg>
`.trim();

class BezierCurve extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _curve_template;

        this.fromCoords = new Point(0, 0);
        this.toCoords = new Point(0, 0);
        this.lfrom = new Point(0, 0);
        this.lto = new Point(0, 0);

        [this.p1, this.p2] = shadow.querySelectorAll("div");
        [this.l1, this.l2] = shadow.querySelectorAll("line");

        this.paths = shadow.querySelectorAll("path");
        this.p1.pos = new Point(0, 0);
        this.p2.pos = new Point(0, 0);
        this.p1.mag = 0;
        this.p2.mag = 0;
        this.tf = BezierCurve.translationFunctions.absoluteTranslation;
        this.symmetry = true;

        this.auxP = new Point();
        this.auxPP = new Point();
        addCustomDrag(this.p1, {
            onmove: (ev, delta) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();
                this.p1.pos.translate(delta.x, delta.y);
                this.updateP1();
                if (this.symmetry) {
                    this.p2.pos.translate(-delta.x, -delta.y);
                    this.updateP2();
                }
                this.update();
            }
        })
        addCustomDrag(this.p2, {
            onmove: (ev, delta) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();
                this.p2.pos.translate(delta.x, delta.y);
                this.updateP2();
                if (this.symmetry) {
                    this.p1.pos.translate(-delta.x, -delta.y);
                    this.updateP1();
                }
                this.update();
            }
        })
        this.selectEvent = new CustomEvent("curveselect", {
            composed: true,
            bubbles: true,
            detail: {}
        })
        this.selected = false;
    }

    updateP1() {
        this.p1.mag = this.auxP.copy(this.p1.pos).sub(this.fromCoords).mag();
        this.p1.angle = Point.angle2(this.auxPP.copy(this.toCoords).sub(this.fromCoords), this.auxP) || 0;
    }
    updateP2() {
        this.p2.mag = this.auxP.copy(this.p2.pos).sub(this.toCoords).mag();
        this.p2.angle = Point.angle2(this.auxPP.copy(this.fromCoords).sub(this.toCoords), this.auxP) || 0;
    }

    update() {
        let new_val = `M ${this.fromCoords.x} ${this.fromCoords.y} C${this.p1.pos.x} ${this.p1.pos.y}, ${this.p2.pos.x} ${this.p2.pos.y}, ${this.toCoords.x} ${this.toCoords.y}`;

        this.paths.forEach(p => p.setAttribute("d", new_val));
        this.p1.style.cssText += `transform: translate(${this.p1.pos.x}px, ${this.p1.pos.y}px);`
        this.p2.style.cssText += `transform: translate(${this.p2.pos.x}px, ${this.p2.pos.y}px);`

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
            this.arrow.style.cssText = `
                left: ${middle.x}px; top: ${middle.y}px; 
                transform-origin: 0 0;
                transform: rotate(${Math.atan2(slope.y, slope.x) * Math.rad2Deg}deg) translate(-50%,-50%);
            `;
        }
    }

    addArrow() {
        this.arrow = this.shadowRoot.appendChild(
            elementFromHtml(`
            <svg viewBox="0 0 256 512" class="arrow">
                <path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128"/>
            </svg>
            `)
        );
        this.update();
    }

    f(t = 0) {
        if (t > 1) t = 1;
        return new Point(
            ((1 - t) ** 3) * this.from.x + 3 * t * ((1 - t) ** 2) * this.p1.pos.x + 3 * (t ** 2) * (1 - t) * this.p2.pos.x + (t ** 3) * this.to.x,
            ((1 - t) ** 3) * this.from.y + 3 * t * ((1 - t) ** 2) * this.p1.pos.y + 3 * (t ** 2) * (1 - t) * this.p2.pos.y + (t ** 3) * this.to.y,
        )
    }

    df(t = 0) {
        return new Point(
            ((3 * (1 - t) ** 2) * (this.p1.pos.x - this.from.x) + 6 * (1 - t) * t * (this.p2.pos.x - this.p1.pos.x) + 3 * t ** 3 * (this.to.x - this.p2.pos.x)),
            ((3 * (1 - t) ** 2) * (this.p1.pos.y - this.from.y) + 6 * (1 - t) * t * (this.p2.pos.y - this.p1.pos.y) + 3 * t ** 3 * (this.to.y - this.p2.pos.y))
        )
    }




    set from({ x, y }) {
        this.lfrom.copy(this.fromCoords);
        this.fromCoords.set(x, y);
        this.tf(this, 0);
        this.update();
    }
    get from() { return this.fromCoords }
    set to({ x, y }) {
        this.lto.copy(this.toCoords);
        this.toCoords.set(x, y);
        this.tf(this, 1);
        this.update();
    }
    get to() { return this.toCoords };

    set selected(flag) {
        this.select = !!flag;
        this.selectEvent.detail.selected = this.select;
        this.dispatchEvent(this.selectEvent);

        this.p1.classList.toggle("hide", !flag);
        this.l1.classList.toggle("hide", !flag);
        this.p2.classList.toggle("hide", !flag);
        this.l2.classList.toggle("hide", !flag);
    }
    get selected() { return this.select }

    static translationFunctions = {
        /**@param {BezierCurve} curve */
        absoluteTranslation: (curve, p) => {
            if (p == 0) curve.p1.pos.translate(curve.fromCoords.x - curve.lfrom.x, curve.fromCoords.y - curve.lfrom.y);
            else curve.p2.pos.translate(curve.toCoords.x - curve.lto.x, curve.toCoords.y - curve.lto.y);
        },
        /**@param {BezierCurve} curve */
        relativeTranslation: (curve, p) => {
            let middle = new Point().copy(curve.toCoords).add(curve.fromCoords).multiplyScalar(0.5);
            let dir1 = new Point().copy(middle).sub(curve.fromCoords).normalize();
            let dir2 = new Point().copy(middle).sub(curve.toCoords).normalize();

            curve.p1.pos.copy(curve.fromCoords).add(dir1.rotateAround(curve.p1.angle || 0).multiplyScalar(curve.p1.mag));
            curve.p2.pos.copy(curve.toCoords).add(dir2.rotateAround(curve.p2.angle || 0).multiplyScalar(curve.p2.mag));
        },
    }
}

customElements.define("curved-path", BezierCurve);


class EdgeProps {
    constructor(obj) {
        this.mode = "absolute";
        this.symmetry = true;
        this.from;
        this.to;
        this.graphId;
        this.p1 = new Point();
        this.p2 = new Point();
        this.custom = {};
        this.states = {
            selected: false,
            active: false,
        }

        if (obj) mergeDeep(this, obj);
    }
    copy() {
        return Object.assign(new EdgeProps(), JSON.parse(JSON.stringify(this)));
    }
}