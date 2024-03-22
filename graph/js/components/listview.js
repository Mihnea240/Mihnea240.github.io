class listView extends HTMLElement{
    static sizeObserver=new ResizeObserver((entries) => {
        for (let entry of entries) {
            let list = entry.target;
            let {inlineSize: w, blockSize: h } = entry.borderBoxSize[0];
            console.log(w, h);
            if (!list.autofit || (list.dir==0 && Math.abs(list.size.x-w)<5) || (list.dir==1 && Math.abs(list.size.y-h)<5)) continue;

            if (list.dir == 0) {
                
            }
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
        this.fit = false;
        this.flow = 0;
        this.firstIndex = 0;

        //const shadow = this.attachShadow({mode: open})
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name){
            case "length": this.viewLength = parseInt(newValue) || 0; break;
            case "autofit": this.autofit = newValue; break;
            case "break": this.break = parseInt(newValue) || 0; break;
            case "autoflow": this.autoflow = newValue; break;
            case "direction": this.direction = newValue; break;
        }
    }

    set direction(val) {
        if (val === "column") this.flow = 0;
        else if (val === "row") this.flow = 1;
        else this.flow = val;

        console.log(this.flow)
        this.style.flexDirection = this.flow ? "row" : "column";
    }
    get direction() { return this.flow; }

    set autofit(val) {
        if (val) this.viewLength = this.autoSize();
    }
    get autofit() { return this.fit; }

    autoSize(){
        let unit = this.children[0][this.flow ? "clientWidth" : "clientHeight"];
        return Math.ceil(this[this.flow ? "clientWidth" : "clientHeight"] / unit);
    }

    render() {
        this.list.forEach(el => this.push(el));
        if (this.autoflow && this.viewLength) {
            for (let i = this.list.length; i <= this.viewLength; i++)this.push(this.countingFunction(i));
        }
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

        this.style.display = "flex";
        this.render();
    }
}

customElements.define("list-view",listView);