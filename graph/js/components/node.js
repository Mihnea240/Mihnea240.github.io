
const _node_template = /* html */`
    <style>
        .description{
            user-select: none;
            margin: .1rem .2rem;
            &:focus{
                outline: none;
            }

        }
    </style>
    <div class="description"></div>
    <slot></slot>
`.trim();

class NodeUI extends HTMLElement{
    static observedAttributes = ["view","template"];
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;

        this.oncontextmenu = (ev) => ev.preventDefault();
        this.onmove = _ => true;
        this.nodeId;
        this.graphId;
        this._description = 0;
        this._selected = false;
        this.active = false;
        this.focused = false;
        this.new_node_protocol=false;
        this.mass = 1;
        this.isStatic = false;
        this.transform = new Transform();
        this.template = "default";

        this.point = new Point();
    }

    init(props) {
        mergeDeep(this, props);
        this.getTemplate().load(this);

        this.update(false);
    }
    
    set selected(flag) { this.classList.toggle("selected", this._selected = flag) }
    get selected() { return this._selected }
    
    set description(text) {
        this.shadowRoot.querySelector(".description").textContent = this._description = text;
    }
    get description() { return this._description }

    set template(string) {this.setAttribute("template", string);}
    get template() { return this.getAttribute("template"); }
    
    initCurve() {
        if (this.new_node_protocol) {
            this.parentElement.curve.classList.add("hide");
            this.new_node_protocol = false;
            return false;
        }
        this.parentElement.curve.classList.remove("hide");
        this.new_node_protocol = true;
        return true;
    }
    relativePosition(x = 0, y = 0, point = new Point()) {
        return point.set(
            this.transform.position.x + this.transform.size.x * x,
            this.transform.position.y + this.transform.size.y * y
        ); 
    }

    anchor(point = new Point()) {
        let { x, y } = this.getTemplate().anchor;
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
        //this.style.cssText += `left: ${this.transform.position.x}px; top: ${this.transform.position.y}px`;
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
    getTemplate() {
        return NodeTemplate.get(this.template);
    }


    editText() {
        let des = this.shadowRoot.querySelector(".description");
        des.setAttribute("contenteditable", true);
        this.focused = true;
        des.addEventListener("blur", (ev) => {
            des.setAttribute("contenteditable", false);
            this._description = des.textContent;
            this.focused = false;
        },{once: true})
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
    static styleSheet = document.head.appendChild(document.createElement("style")).sheet;

    constructor(name,styles,data) {
        this.id = NodeTemplate.styleSheet.insertRule(`graph-node[template="${name}"]{${styles}}`);
        this.name = name;
        
        this.anchor = { x: 0.5, y: 0.5 };
        this.viewMode = "description";
        mergeDeep(this, data);

        NodeTemplate.map.set(name, this);
    }
    load(node) {
        node.viewMode = this.viewMode;
        node.transform.size.set(25, 25);
    }
    set style(data) {
        this.id = NodeTemplate.styleSheet.insertRule(data);
    }

    get style() {
        return NodeTemplate.styleSheet.cssRules[this.id];
    }

    toJSON() {
        return {
            name: this.name,
            anchor: this.anchor,
            viewMode: this.viewMode,
            custom: this.custom,
            css: this.style.cssText,
        }
    }
}