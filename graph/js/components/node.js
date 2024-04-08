
const _node_template = /* html */`
    <div class="description"></div>
    <slot></slot>
`.trim();

class NodeUI extends HTMLElement{
    static observedAttributes = ["display","template"];
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;
        shadow.adoptedStyleSheets = [NodeTemplate.styleSheet];

        this.oncontextmenu = (ev) => ev.preventDefault();
        this.onmove = _ => true;
        this.nodeId;
        this.graphId;
        this._description = 0;
        this._selected = false;
        this.active = false;
        this.focused = false;
        this.mass = 1;
        this.isStatic = false;
        this.transform = new Transform();
        this.template = "default";

        this.point = new Point();
    }

    init(props) {
        mergeDeep(this, props);
        NodeTemplate.get(this.template).load(this);

        this.update(false);
    }
    
    set selected(flag) { this.classList.toggle("selected", this._selected = flag) }
    get selected() { return this._selected }
    
    set description(text) {
        this.shadowRoot.querySelector(".description").textContent = text;
    }
    get description() { return this.shadowRoot.querySelector(".description").textContent }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        switch (name) {
            case "display": {
                switch (oldValue) {
                    case "description": {
                        let desc = this.shadowRoot.querySelector(".description");
                        desc.removeEventListener("mouseup", this.mouseUpEvent);
                        desc.removeEventListener("blur", this.blurEvent);
                        break;
                    }
                }
                switch (newValue) {
                    case "description": {
                        let desc = this.shadowRoot.querySelector(".description");
                        desc.addEventListener("mouseup", this.mouseUpEvent);
                        desc.addEventListener("blur", this.blurEvent);
                        break;
                    }
                }
            }
        }
    }
    
    mouseUpEvent(ev) {
        if (ev.detail == 2) {
            
            this.setAttribute("contenteditable", this.getRootNode().host.focused = true);
            this.focus()
        } 
    }
    blurEvent(ev) {
       this.setAttribute("contenteditable",this.getRootNode().host.focused = false);
    }

    relativePosition(x = 0, y = 0, point = new Point()) {
        return point.set(
            this.transform.position.x + this.transform.size.x * x,
            this.transform.position.y + this.transform.size.y * y
        ); 
    }

    anchor(point = new Point()) {
        let { x, y } = NodeTemplate.get(this.template).anchor;
        return this.relativePosition(x, y, point);
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
        this.style.cssText += `transform: translate(${this.transform.position.x}px, ${this.transform.position.y}px);`;
        if (updateEdges) {
            this.parentElement.recalculateEdges(this.nodeId, this.anchor(this.point));
        }
            
    }

    scrollIntoView() {
        this.parentElement.focus(this.transform.position);
    }

    getGraph() {
        return Graph.get(this.graphId);
    }
    toJSON() {
        return {
            nodeId: this.nodeId,
            template: this.template,
            isStatic: this.isStatic,
            mass: this.mass,
            description: this.description,
            transform: this.transform,
        }
    }
}

customElements.define("graph-node", NodeUI);

class NodeTemplate{
    /**@type {Map<string,NodeTemplate>} */
    static map = new Map();
    static get(name) { return NodeTemplate.map.get(name) }
    static styleSheet = (() => {
        let a = new CSSStyleSheet();
        a.replaceSync(defaultTemplateStyls.node);
        return a;
    })();

    constructor(name,styles,data) {
        this.id = NodeTemplate.styleSheet.insertRule(`graph-node[template=${name}]{${styles}}`);
        this.name = name;
        
        this.anchor = { x: 0.5, y: 0.5 };
        this.display = "description";
        mergeDeep(this, data);

        NodeTemplate.map.set(name, this);
    }
    load(node) {
        node.setAttribute("display", this.display);
        node.setAttribute("template", this.name);
        node.transform.size.set(25, 25);
    }
    set cssRule(data) {
        this.id = NodeTemplate.styleSheet.insertRule(data);
    }

    get cssRule() {
        return NodeTemplate.styleSheet.cssRules[this.id];
    }
    get style() {
        return this.cssRule.style.cssText;
    }
    toJSON() {
        return {
            name: this.name,
            anchor: this.anchor,
            viewMode: this.viewMode,
            custom: this.custom,
            css: this.style,
        }
    }
}