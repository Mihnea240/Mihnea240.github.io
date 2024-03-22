class listView extends HTMLElement{
    constructor(){
        super();
        this.list=[];
        this.template=(i)=>elementFromHtml(`<div>${this.countingFunction(i)}</div>`);
        this.countingFunction=(i)=>i;
        this.viewLength=Infinity;
        this.break=0;
        this.autoflow=false;
    }

    attributeChangedCallback(name, oldValue, newValue){
        switch(name){
            case "length": this.viewLength=parseInt(newValue)||Infinity; break;
            case "autofit": this.autoflow=newValue; this.initAutoFlow(); break;
            case "break": this.break=parseInt(newValue)||0; break;
            case "autoflow": this.autoflow=newValue; break;
        }
    }

    initAutoFlow(){

    }

    autofit(){

    }

    render(){
        
    }

    connectedCallback(){

    }
}

customElements.define("list-view",listView);