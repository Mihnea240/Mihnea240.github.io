class ListView extends HTMLElement{
    static sizeObserver=new ResizeObserver((entries) => {
        for (let entry of entries) {
            let list = entry.target;
            let { inlineSize: w, blockSize: h } = entry.borderBoxSize[0];
            
            if ((list.dir == 0 && Math.abs(list.size.x - w) < 1) || (list.dir == 1 && Math.abs(list.size.y - h) < 1)) continue;
            
            list.size.x = w;
            list.size.y = h;
            list.render();
        }
    })
    static styleDeclaration=`
        <style>
            :host{
                display: flex;
            }
            :host([direction="row"]){
                flex-direction: row;
            }
            :host([direction="column"]){
                flex-direction: column;
            }
            :host([autofit=true]){
                flex-grow: 0;
            }
            :host( >*){
                overflow: visible;
            }
        </style>
        <slot name='item'></slot>
        <slot></slot>
    `.trim();

    static observedAttributes = ["length", "autofit", "break", "autoflow", "direction", "target"];
    constructor(){
        super();
        this.template = () => document.createElement("div");
        this.load = (child, val) => child.textContent = val;
        this.countingFunction = (i) => i;
        this.scrollEventHandler = () => this.move(0);
        this.observedList;
        
        this.viewLength = 0;
        this.break=0;
        this.autoflow = false;
        this.autofit = false;
        this.flow = 0;
        this.firstIndex = 0;
        
        this.size = { x: 0, y: 0 };
        this.unit = { x: 0, y: 0 };
        this.scrollOffset = { x: 1, y: 1 };
        const shadow = this.attachShadow({mode: "open"});
        shadow.innerHTML = ListView.styleDeclaration;

        this.list = [];

        this.tabIndex = 0;
        this.addEventListener("keydown", function (ev) {
            let unit = this.getUnit();
            if (ev.key == "ArrowLeft" || ev.key == "ArrowUp") this.move(-unit);
            else if(ev.key=="ArrowRight" || ev.key=="ArrowDown") this.move(unit);
        })
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name){
            case "length": {
                if (newValue == "auto") {
                    this.autofit = true;
                }else if (!newValue) this.autofit = false;
                else this.length = parseInt(newValue) || 0;
                this.render();
                break;
            }
            case "autofit": this.autofit = newValue; this.render(); break;
            case "break": this.break = parseInt(newValue) || 0; break;
            case "autoflow": this.autoflow = newValue; this.render(); break;
            case "direction": this.direction = newValue; break;
            case "target": this.scrollTarget = this.closest(newValue); break; 
        }
    }

    set direction(val) {
        if (val === "column") this.flow = 0;
        else if (val === "row") this.flow = 1;
        else this.flow = val;
    }
    get direction() { return this.flow; }

    set length(val) {
        this.viewLength = val;
        this.render();
    }
    get length() { return this.viewLength }

    set target(target) {
        this.target?.removeEventListener("scroll", this.scrollEventHandler);
        this.scrollTarget = target;
        this.scrollTarget.addEventListener("scroll", this.scrollEventHandler);
    }
    get target() { return this.scrollTarget }

    set list(newList) {
        this.observedList = new Proxy(newList, {
            set: (obj, prop, value) => {
                obj[prop] = value;
                if (prop == "length") this.render();
                else this.update(parseInt(prop));
                return true;
            }
        })
        this.render();
        this.update();
    }
    get list() { return this.observedList; }
    get itemSlot() { return this.shadowRoot.querySelector("slot"); }
    get items() { return this.itemSlot.assignedNodes(); }

    render() {
        let n;
        if (this.autofit) {
            n = Math.ceil(this.getSize() / this.getUnit()) + 2;
            if (!this.autoflow) {
                if (this.length) n = Math.min(n, this.length);
                n = Math.min(n, this.list.length);
            }
        }else if (!this.length) n = this.list.length;
        else n = Math.min(this.length, this.list.length);
        this.setWindowSize(n);
    }
    update(index) {
        let n = this.items.length;
        if (index === undefined) {
            for (let i = 0; i < n; i++) {
                let data = this.data(i + this.firstIndex);
                if (data!=undefined) this.load(this.items[i], data, i);
            }
        }
        else if (index >= 0 && index < n) this.load(this.items[index], this.data(index + this.firstIndex), index);
    }
    data(index) {
        return (index >= 0 && index < this.list.length) ? this.list[index] : this.autoflow ? this.countingFunction(index) : undefined;
    }

    getUnit() {
        if (this.unit.x + this.unit.y == 0) {
            let rect;
            if (!this.items.length) {
                let node = this.appendChild(this.template());
                rect = node.getBoundingClientRect();
                node.remove();
            }else rect = this.children[0].getBoundingClientRect();
            this.unit.x = rect.width;
            this.unit.y = rect.height;
        } else return this.unit[this.flow ? "x" : "y"] || 1;
    }
    getSize() {
        return this.size[this.flow ? "x" : "y"];
    }
    getScroll() {
        return this.scrollTarget?.[this.flow ? "scrollLeft" : "scrollTop"] || this.scrollOffset[this.flow ? "x" : "y"];
    }

    push(val) {
        this.list.push(val);
        return this.lastElementChild;
    }
    clear() {
        this.list = [];
        this.itemSlot.innerHTML = "";
    }
    pop() {
        let n = this.children.length;
        if (n == 0) return;
        this.children[n - 1].remove();
        if (n <= this.list.length) return this.list[n - 1];
    }

    setWindowSize(val) {
        let n = this.items.length;
        if (n == val) return;
        
        for (let i = n, data, child; i < val; i++) {
            data = this.data(i + this.firstIndex);
            if (data!==undefined) {
                child = this.template();
                child.slot = "item";
                if (this.load(child, data, i)!==false) this.appendChild(child);
            }
        }
        for (let i = n; i > val; i--)this.pop();
    }
    
    move(value) {
        if (!this.autoflow && this.items.length >=  this.list.length) return;
        if (this.flow) {
            this.scrollOffset.x += value;
            if (this.scrollOffset.x < 0) this.scrollOffset.x = 0;
            if (this.scrollOffset.x > this.size.x) this.scrollOffset.x = this.size.x;

        } else {
            this.scrollOffset.y += value;
            if (this.scrollOffset.y < 0) this.scrollOffset.y = 0;
            if (this.scrollOffset.y > this.size.y) this.scrollOffset.y = this.size.y;
        }

        let newIndex = Math.floor(this.getScroll() / this.getUnit());
        this.firstIndex = newIndex < 0 ? 0 : newIndex;

        this.update();
        let v = this.getScroll() / this.getUnit();
        let to = (Math.floor(v) - v) * this.getUnit();
        let x = 0, y = 0;
        this.flow ? x = to : y = to;

        this.style.cssText += `transform: translate(${x}px, ${y}px)`;      
    }

    connectedCallback() {
        let rect=this.getBoundingClientRect();
        this.size = { x: rect.width, y: rect.height }; 
        ListView.sizeObserver.observe(this);

        if (!this.getAttribute("direction")) this.setAttribute("direction", "column");
        this.tabIndex = 0;
        this.getUnit();
        setTimeout(_ => this.render(), 0);
        
    }
}

customElements.define("list-view",ListView);