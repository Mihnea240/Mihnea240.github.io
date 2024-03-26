class listView extends HTMLElement{
    static sizeObserver=new ResizeObserver((entries) => {
        for (let entry of entries) {
            let list = entry.target;
            let { inlineSize: w, blockSize: h } = entry.borderBoxSize[0];
            
            if (!list.autofit || (list.dir == 0 && Math.abs(list.size.x - w) < 1) || (list.dir == 1 && Math.abs(list.size.y - h) < 1)) continue;
            
            list.size.x = w;
            list.size.y = h;
            list.autoSize();
        }
    })
    static observedAttributes = ["length", "autofit", "break", "autoflow", "direction"];
    constructor(){
        super();
        this.list=[];
        this.template = (i) => elementFromHtml(`<div>${i}</div>`);
        this.load = (child, val) => child.textContent = val;
        this.countingFunction = (i) => i;
        
        this.viewLength=0;
        this.break=0;
        this.autoflow = false;
        this.autofit = false;
        this.flow = 0;
        this.firstIndex = 0;
        
        this.size = { x: 0, y: 0 };
        this.unit = { x: 0, y: 0 };
        this.translation = { x: 1, y: 1 };
        listView.sizeObserver.observe(this);
        //const shadow = this.attachShadow({mode: open})
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name){
            case "length": this.length = parseInt(newValue) || 0; break;
            case "autofit": this.autofit = newValue; this.autoSize(); break;
            case "break": this.break = parseInt(newValue) || 0; break;
            case "autoflow": this.autoflow = newValue; break;
            case "direction": this.direction = newValue; break;
        }
    }

    set direction(val) {
        if (val === "column") this.flow = 0;
        else if (val === "row") this.flow = 1;
        else this.flow = val;

        this.style.cssText += `display: flex; flex-direction: ${this.flow ? "row" : "column"}`;
    }
    get direction() { return this.flow; }

    set length(val) {
        let n = this.autofit ? this.childElementCount : this.viewLength;
        if (val == n) return;
        
        for (let i = n; i <= val; i++)this.appendChild(this.template(this.data(i+this.firstIndex)));
        for (let i = n; i > val; i--)this.pop();
        
        if(!this.autofit)this.viewLength = val;
    }
    get length() { return this.viewLength }
    
    data(index) {
        return index < this.list.length ? this.list[index] : this.countingFunction(index);
    }

    autoSize() {
        if (!this.autofit) return;  
        return this.length = this.length > 1 ? this.length : Math.ceil(this.getSize() / this.getUnit())+2;
    }

    getUnit() {
        if (!this.children.length) {
            this.length = 1;
            let rect = this.children[0].getBoundingClientRect();
            this.unit.x = rect.width;
            this.unit.y = rect.height;
            this.style.cssText+=`translate: ${-this.getUnit()}px 0;`
        }
        return this.unit[this.flow ? "x" : "y"] || 1;
    }
    getSize() {
        return this.size[this.flow ? "x" : "y"];
    }
    getScroll() {
        return this.scrollTarget()[this.flow ? "scrollLeft" : "scrollTop"];
    }

    push(val) {
        let child = this.template(val);
        if (child) {
            this.list.push(val);
            this.appendChild(child);
            return child;
        }
        return false;
    }
    pop() {
        let n = this.children.length;
        if (n == 0) return;
        this.children[n - 1].remove();
        if (n <= this.list.length) return this.list[n - 1];
    }
    render() {
        this.length = this.list.length;
    }

    update() {
        for (let i = 0; i < this.childElementCount; i++) this.load(this.children[i],this.data(i+this.firstIndex));
    }

    clear() {
        this.list = [];
        this.innerHTML = "";
    }
    
    scrollTarget() {
        return this.target || this;
    }
    move(value) {
        let sign = value > 0 ? 1 : -1; value = Math.abs(value);
        let offset = Math.floor(value / this.getUnit());
        
        let to = (value - (offset - 1) * this.getUnit()) * sign;

        this.animation=this.animate([
            { transform: `translate(${to}px,0)` },
            { transform: `translate(0,0)` },
        ], {
            duration: Math.abs(to)*5,
            iterations: 1,
        })
        this.firstIndex += offset*sign;
        this.update();
    }

    connectedCallback() {
        let rect=this.getBoundingClientRect();
        this.size = { x: rect.width, y: rect.height }; 
        if (!this.getAttribute("direction")) this.direction = "column";
        this.tabIndex = 0;

        this.addEventListener("keydown", function (ev) {
            let unit = this.getUnit();
            console.log(ev.key)
            if (ev.key == "ArrowLeft" || ev.key == "ArrowUp") this.move(-unit);
            else if(ev.key=="ArrowRight" || ev.key=="ArrowDown") this.move(unit);
        })

        this.getUnit();
        this.render();
    }
}

customElements.define("list-view",listView);