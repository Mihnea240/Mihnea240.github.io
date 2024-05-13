const _curve_template =/* html */`
    <style>
        #hit-area,#visible,svg{
            position: absolute;
            stroke: white;
            fill: none;
            z-index: 10;
            display: block;
        }
        svg{
            width: 2px;
            height: 2px;
        }
        svg path:hover{
            stroke-width: calc(var(--edge-width)*3);
            filter: drop-shadow(0 0 1px white);
            opacity: 0.7;
        }
        .point{
            position: absolute;
            width: 10px; height: 10px;
            border-radius: 50%;
            border: 1px solid white;
            background-color: white;
            translate: -50% -50%;
            z-index: 100;
        }
        [part='arrow'] {
            position: absolute;
            fill: white;
            translate: -50% -50%;
            width: calc(15 * var(--edge-width));
            height: calc(15 * var(--edge-width));
        }
    </style>
    <svg id="curve" overflow="visible">
        <path id="visible"></path>
    </svg>
`.trim();

class BezierCurve extends HTMLElement {
    static activeEvent = new CustomEvent("curveselect", { composed: true, bubbles: true });
    static observedAttributes = ["symmetry", "mode"];
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _curve_template;
        shadow.adoptedStyleSheets = [EdgeTemplate.styleSheet];

        this.fromCoords = new Point();
        this.toCoords = new Point();
        this.P1 = new Point();
        this.P2 = new Point();
        this.a1 = new Point();
        this.a2 = new Point();
        this.a3 = new Point();
        this.lastDirection = new Point();
        this.polar = {
            P1: new Point(),
            P2: new Point()
        }

        this.tf = BezierCurve.absoluteTranslation;
        this.symmetry = 0;
        this._active = false;


        this.controlPoints = {};
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name == "symmetry") {
            this.symmetry = parseInt(newValue);
        }
        if (name == "mode") {
            if (newValue == "relative") this.tf = BezierCurve.relativeTranslation;
            else if (newValue == "absolute") this.tf = BezierCurve.absoluteTranslation;
        }
    }
    toggleControlPoints() {
        if (this.active) {
            for (let k in this.controlPoints) this.controlPoints[k].remove?.();
            return this.controlPoints = {};   
        }
        let namespace = this.shadowRoot.querySelector("#curve").namespaceURI;
        
        this.controlPoints.p1 = this.shadowRoot.appendChild(elementFromHtml(`<div class="point" draggable="false"></div>`));
        this.controlPoints.p2 = this.shadowRoot.appendChild(elementFromHtml(`<div class="point" draggable="false"></div>`));
        this.controlPoints.l1 = this.shadowRoot.querySelector("svg").appendChild(document.createElementNS(namespace,"line"));
        this.controlPoints.l2 = this.shadowRoot.querySelector("svg").appendChild(document.createElementNS(namespace,"line"));
        addCustomDrag(this.controlPoints.p1, { onmove: (ev, delta) => { ev.stopPropagation(); ev.stopImmediatePropagation(); this.translateP1(delta) } });
        addCustomDrag(this.controlPoints.p2, { onmove: (ev, delta) => { ev.stopPropagation(); ev.stopImmediatePropagation(); this.translateP2(delta) } });
    }

    update() {
        let new_val = `M ${this.fromCoords.x} ${this.fromCoords.y} C${this.P1.x} ${this.P1.y}, ${this.P2.x} ${this.P2.y}, ${this.toCoords.x} ${this.toCoords.y}`;
        this.shadowRoot.querySelectorAll("#hit-area, #visible").forEach(p => p.setAttribute("d", new_val));

        if (this.active) {
            this.controlPoints.p1.style.cssText += `transform: translate(${this.P1.x}px, ${this.P1.y}px);`
            this.controlPoints.p2.style.cssText += `transform: translate(${this.P2.x}px, ${this.P2.y}px);`
    
            this.controlPoints.l1.setAttribute("x1", this.fromCoords.x);
            this.controlPoints.l1.setAttribute("y1", this.fromCoords.y);
            this.controlPoints.l1.setAttribute("x2", this.P1.x);
            this.controlPoints.l1.setAttribute("y2", this.P1.y);
    
            this.controlPoints.l2.setAttribute("x1", this.toCoords.x);
            this.controlPoints.l2.setAttribute("y1", this.toCoords.y);
            this.controlPoints.l2.setAttribute("x2", this.P2.x);
            this.controlPoints.l2.setAttribute("y2", this.P2.y);
        }

    }

    f(t = 0, point=new Point()) {
        if (t > 1) t = 1;
        return point.set(
            ((1 - t) ** 3) * this.fromCoords.x + 3 * t * ((1 - t) ** 2) * this.P1.x + 3 * (t ** 2) * (1 - t) * this.P2.x + (t ** 3) * this.toCoords.x,
            ((1 - t) ** 3) * this.fromCoords.y + 3 * t * ((1 - t) ** 2) * this.P1.y + 3 * (t ** 2) * (1 - t) * this.P2.y + (t ** 3) * this.toCoords.y,
        )
    }

    df(t = 0, point=new Point()) {
        return point.set(
            ((3 * (1 - t) ** 2) * (this.P1.x - this.fromCoords.x) + 6 * (1 - t) * t * (this.P2.x - this.P1.x) + 3 * t ** 3 * (this.toCoords.x - this.P2.x)),
            ((3 * (1 - t) ** 2) * (this.P1.y - this.fromCoords.y) + 6 * (1 - t) * t * (this.P2.y - this.P1.y) + 3 * t ** 3 * (this.toCoords.y - this.P2.y))
        )
    }

    length() {
        this.auxPP.copy(this.fromCoords);
        let length = 0;
        for (let t = 0.1; t < 1; t+=0.1){
            length += this.auxPP.sub(this.f(t)).mag();
            this.auxPP.copy(this.auxP);
        }
        return length;
    }

    direction(point=new Point()) {
        return point.copy(this.toCoords).sub(this.fromCoords).normalize();
    }

    fromPosition(p, update=true) {
        if (!p) return this.fromCoords;
        let x = p.x - this.fromCoords.x, y = p.y - this.fromCoords.y;
        this.fromCoords.copy(p);
        this.tf(this, 0, x, y);
        
        if (update) this.update();
    }
    translateFrom(p, update = true) { this.fromPosition(this.a3.copy(this.fromCoords).add(p), update) }
    
    toPosition(p, update = true) {
        if (!p) return this.toCoords;
        let x = p.x - this.toCoords.x, y = p.y - this.toCoords.y;
        this.toCoords.copy(p);
        this.tf(this, 1, x, y);
        
        if (update) this.update();
    }
    translateTo(p, update = true) { this.toPosition(this.a3.copy(this.toCoords).add(p), update) }



    p1Position(p, update = true) {
        if (!p) return this.P1;
        if (this.symmetry) {
            this.P2.add(this.a2.copy(p).sub(this.P1).multiplyScalar(this.symmetry));
            this.pointData();
        }else this.pointData(1);
        this.P1.copy(p);
        if (update) this.update();
    }
    translateP1(p, update = true) { this.p1Position(this.a1.copy(this.P1).add(p), update); }
    
    p2Position(p, update = true) {
        if (!p) return this.P2;
        if (this.symmetry) {
            this.P1.add(this.a1.copy(p).sub(this.P2).multiplyScalar(this.symmetry));
            this.pointData();
        }else this.pointData(2);
        this.P2.copy(p);
        if (update) this.update();
    }
    translateP2(p, update = true) { this.p2Position(this.a2.copy(this.P2).add(p), update); }
    
    relativeP1(point=new Point()) {
        return point.copy(this.P1).sub(this.fromCoords);
    }
    relativeP2(point=new Point()) {
        return point.copy(this.P2).sub(this.toCoords);
    }

    pointData(p) {
        let dir = this.direction();
        if (p != 2) {
            this.relativeP1(this.a3);
            this.polar.P1.set(Point.angle2(dir, this.a3) || 0, this.a3.mag());
        }
        if (p != 1) {
            this.relativeP2(this.a3);
            dir.multiplyScalar(-1);
            this.polar.P2.set(Point.angle2(dir, this.a3)|| 0, this.a3.mag());
        }
    }

    set active(flag) {
        if (this._active == !!flag) return;
        this.toggleControlPoints();
        this._active = !!flag;
        this.update();
        this.dispatchEvent(BezierCurve.activeEvent);
    }
    get active() { return this._active }
    set mode(mode) { this.setAttribute("mode", mode); }
    get mode() { return this.getAttribute("mode"); }

    /**@param {BezierCurve} curve */
    static absoluteTranslation(curve, p, x=0, y=0){
        if (p == 0) curve.P1.translate(x, y);
        else curve.P2.translate(x, y);
    }
    /**@param {BezierCurve} curve */
    static relativeTranslation(curve, p){
        let dir1 = curve.direction(curve.a3);
        let dir2 = curve.a2.copy(dir1).multiplyScalar(-1);

        curve.P1.copy(curve.fromCoords).add(dir1.rotateAround(curve.polar.P1.x).multiplyScalar(curve.polar.P1.y));
        curve.P2.copy(curve.toCoords).add(dir2.rotateAround(curve.polar.P2.x).multiplyScalar(curve.polar.P2.y));
    }
}

customElements.define("curved-path", BezierCurve);


class EdgeUI extends BezierCurve {
    constructor() {
        super();

        this.template = "default";
        this.from;
        this.to;
        this.graphId;
        this._selected = false;
        this._active = false;
        this.focused = false;
        this.custom = {};
        this.offset = 0;
    }

    init({ p1, p2, ...props }, v1, v2,update=true) {
        mergeDeep(this, props);
        EdgeTemplate.get(this.template).load(this);

        this.fromCoords.copy(v1);
        this.toCoords.copy(v2);
        this.P1.copy(v1); 
        this.P2.copy(v2);
        
        if (p1) this.P1.add(p1);
        
        if (p2) this.P2.add(p2);
        
        this.pointData();

        if(update)this.update();
    }
    update() {
        if (this.arrow) {
            let middle = this.f(0.5), slope = this.df(0.5);
            this.arrow.style.cssText += `    
                left: ${middle.x}px;  top: ${middle.y}px;
                transform: rotate(${Math.atan2(slope.y,slope.x)}rad);
            `
        }
        super.update();
    }

    addArrow() {
        this.arrow = this.shadowRoot.appendChild(elementFromHtml(`
        <svg viewBox="0 0 256 512" part="arrow">
            <path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128"></path>
        </svg>
        `))
    }

    scrollIntoView() {
        this.parentElement.focus(this.fromCoords.clone().add(this.toCoords).multiplyScalar(0.5));
    }

    set template(string) {this.setAttribute("template", string);}
    get template() { return this.getAttribute("template"); }

    getBoundingClientRect() {
        return this.shadowRoot.querySelector("path").getBoundingClientRect();
    }

    getGraph() {
        return Graph.get(this.graphId);
    }

    set selected(flag) {
        this.classList.toggle("selected", flag);
        this._selected = flag;
    }
    get selected() { return this._selected }

    toJSON() {
        return {
            from: this.from,
            to: this.to,
            p1: this.relativeP1(),
            p2: this.relativeP2(),
            symmetry: this.symmetry,
            mode: this.mode,
        }
    }
}

customElements.define("graph-edge", EdgeUI);


class EdgeTemplate{
    /**@type {Map<string,NodeTemplate>} */
    static map = new Map();
    static get(name) { return EdgeTemplate.map.get(name) }
    static styleSheet = (() => {
        let a = new CSSStyleSheet();
        a.replaceSync(defaultTemplateStyls.edge);
        return a;
    })();

    constructor(name,styles,data) {
        this.id = EdgeTemplate.styleSheet.insertRule(`graph-edge[template="${name}"]{` + styles + "}");
        this.name = name;

        this.mode = "absolute";
        this.symmetry = -1;
        this.arrowAnchor = 0.5;
        this.offsetWhenOverlapping = 30;
        this.pointOffsetWhenOverlapping = 0;
        
        mergeDeep(this, data);

        EdgeTemplate.map.set(name, this);
    }
    load(edge) {
        edge.setAttribute("mode", this.mode);
        edge.symmetry = this.symmetry;
    }
    set cssRule(data) {
        this.id = EdgeTemplate.styleSheet.insertRule(data);
    }

    get cssRule() {
        return EdgeTemplate.styleSheet.cssRules[this.id];
    }

    toJSON() {
        return {
            name: this.name,
            custom: this.custom,
            css: this.cssRule.cssText,
        }
    }
}