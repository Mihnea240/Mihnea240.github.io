
const _node_template = /* html */`
    <slot></slot>
`.trim();

class NodeUI extends HTMLElement{
    static observedAttributes = ["view"];
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _node_template;

        this.oncontextmenu = (ev) => ev.preventDefault();
        this.onmove = _ => true;
    }

    /**@param {NodeProps} props  */
    init(props) {
        this.props = props;
        this.id = `g${this.graphId} ${this.nodeId}`;

        this.setAttribute("view", this.props.states.viewMode);
        this.position(this.transform.position.x, this.transform.position.y, false);
    }
    get nodeId() { return this.props.details.id }
    get graphId() { return this.props.details.graphId }
    get transform() { return this.props.physics.transform }
    
    set selected(flag) { this.classList.toggle("selected", this.props.states.selected = flag) }
    get selected() { return this.props.states.selected }

    set active(flag) { this.props.states.active = flag }
    get active() { return this.props.states.active }

    set new_node_protocol(flag) { this.props.states.new_node_protocol = flag };
    get new_node_protocol() { return this.props.states.new_node_protocol };
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name != "view") return;
        this.props.viewMode = newValue;

        switch (newValue) {
            case "description": {
                this.textContent = this.props.details.description;
            }
        }
        

    }

    get viewMode() { return this.props.viewMode }

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
        //this.style.cssText += `left: ${this.transform.position.x}px; top: ${this.transform.position.y}px`;
        this.style.cssText += `transform: translate(${this.transform.position.x}px, ${this.transform.position.y}px);`;
        if(updateEdges)this.parentElement.recalculateEdges(this.nodeId, this.middle());
    }

    getGraph() {
        return Graph.get(this.graphId);
    }

    focus() {
        this.parentElement.focus(this.transform.position);
    }
    set description(text) {
        this.textContent = text;
        this.props.details.description = text;
    }

    editText() {
        let input = elementFromHtml(`<text-input allownewline="true" maxLength="64">${this.textContent}</text-input>`);
        this.textContent = "";
        this.appendChild(input);
        input.focus();

        input.addEventListener("change", (ev) => {
            this.innerHTML = "";
            this.description = input.value || this.nodeId;
        }, { once: true });
    }
}

customElements.define("graph-node", NodeUI);


class NodeProps{
    /**@type {Map<string,NodeProps>} */
    static templates = new Map();
    constructor(obj) {

        let type = obj?.constructor.name;
        switch (type) {
            case "NodeProps": return mergeDeep(new NodeProps(), this);
            case "String": return mergeDeep(new NodeProps(), NodeProps.templates.get(obj));
        }
        
        this.details = {
            id: 0,
            graphId: 0,
            template: "default",
            description: 0
        }
        this.physics = {
            mass: 1,
            isStatic: false,
            transform: new Transform(),
        }
        this.states= {
            selected: false,
            active: false,
            new_node_protocol: false,
            viewMode: "description",
        }
        this.custom = {};
        if (type === "Object") mergeDeep(this, obj);
        this.details.description ||= this.details.id;
    }

    createTemplate(name) {
        NodeProps.templates[name] = mergeDeep(new NodeProps(), this);
    }
}