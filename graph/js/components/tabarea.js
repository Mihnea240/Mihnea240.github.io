class TabArea extends HTMLElement{
    constructor() {
        super();
        this.scrollBehavior = { behavior: 'smooth', block: 'nearest', inline: 'center' };
        this.openEvent = new CustomEvent("open", { bubbles: true, detail: {} });
    }

    connectedCallback() {
        this.header = this.querySelector(".header");
        this.tabs = this.querySelector(".tabs");
        this.activeHeader = this.header.querySelector(".active") || this.header.querySelector("[for]");

        let name = this.activeHeader?.getAttribute("for") || this.querySelector(".tabs >[name]");
        if (name) this.selectTab(name);

        this.header?.addEventListener("click", (ev) => {
            let name = ev.target.getAttribute("for");
            if (!name) return;
            this.selectTab(name);
        })
    }

    getTab(name) {
        return this.querySelector(`.tabs > [name="${name}"]`);
    }
    getHeader(name) {
        return this.querySelector(`.header > [for="${name}"]`);
    }
    show(newTab) {
        this.activeTab?.classList.remove("active");
        this.activeTab = newTab;
        this.activeTab.classList.add("active"); 
    }

    selectTab(name) {
        let newSelected = this.getTab(name);
        let newHeader = this.getHeader(name);
        if (!newSelected || newSelected===this.activeTab) return;

        this.openEvent.detail.lastOpened = this.activeTab?.getAttribute("name");
        this.show(newSelected, this.activeTab);
        this.dispatchEvent(this.openEvent);
        
        if (newHeader) {
            this.activeHeader?.classList.remove("active");
            this.activeHeader = newHeader;
            this.activeHeader.classList.add("active");
            this.activeHeader.scrollIntoView(this.scrollBehavior);
        }

        return true;
    }
}

customElements.define("tab-area", TabArea);