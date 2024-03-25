class listView extends HTMLElement{
    static sizeObserver=new ResizeObserver((entries) => {
        for (let entry of entries) {
            let list = entry.target;
            let { inlineSize: w, blockSize: h } = entry.borderBoxSize[0];
            
            if (!list.autofit || (list.dir == 0 && Math.abs(list.size.x - w) < 1) || (list.dir == 1 && Math.abs(list.size.y - h) < 1)) continue;
            
            entry.target.size.x = w;
            entry.target.size.y = h;
            list.autoSize();

        }
    })
    static observedAttributes = ["length", "autofit", "break", "autoflow", "direction"];
    constructor(){
        super();
        this.list=[];
        this.template = (i) => elementFromHtml(`<div>${i}</div>`);
        this.load = (child, val) => { child.textContent = val; }
        this.countingFunction = (i) => i;
        
        this.viewLength=0;
        this.break=0;
        this.autoflow = false;
        this.autofit = false;
        this.flow = 0;
        this.firstIndex = 0;
        
        this.size = { x: 0, y: 0 };
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
        
        for (let i = n; i <= val; i++)this.appendChild(this.template(this.data(i)));
        
        for (let i = n; i > val; i--)this.pop();
        
        if(!this.autofit)this.viewLength = val;
    }
    get length() { return this.viewLength }
    
    data(index) {
        return index < this.list.length ? this.list[index] : this.countingFunction(index);
    }

    autoSize() {
        if (!this.autofit) return;
        if (!this.children.length) this.length = 1;

        let unit = this.children[0][this.flow ? "clientWidth" : "clientHeight"] || 1;
        let fitableItems = Math.floor(this.size[this.flow ? "x" : "y"] / unit)+1;
        
        //console.log(unit, fitableItems);

        return this.length = this.length > 1 ? Math.min(Infinity, this.length) : fitableItems;
    }

    render() {
        this.list.forEach(el => this.push(el));
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

    clear() {
        this.list = [];
        this.innerHTML = "";
    }

    onscroll() {
        
    }

    connectedCallback() {
        (this.target || this).addEventListener("scroll", this.OnScroll);

        let rect=this.getBoundingClientRect();
        this.size = { x: rect.width, y: rect.height }; 

        if (!this.getAttribute("direction")) this.direction = "column";

        this.length = this.list.length;
    }
}

customElements.define("list-view",listView);