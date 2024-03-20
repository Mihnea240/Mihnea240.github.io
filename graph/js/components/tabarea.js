const _tabArea_template = /*html*/`
    <style>
        
    </style>
    <slot></slot>
`

class TabArea extends HTMLElement{
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = _tabArea_template;
        this.scrollBehavior = { behavior: 'smooth', block: 'nearest', inline: 'center' };
    }

    connectedCallback() {
        this.header = this.querySelector(".header");
        this.tabs = this.querySelector(".tabs");
        this.activeHeader = this.header.querySelector(".active") || this.header.querySelector("[for]");

        for (let t of this.tabs.children) t.classList.add("hide");
        let name = this.activeHeader?.getAttribute("for");
        this.activeTab = name ? this.getTab(name) : this.tabs.querySelector(":scope >[name]");

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

    selectTab(name) {
        let newSelected = this.getTab(name);
        let newHeader = this.getHeader(name);
        if (!newSelected) return;

        this.activeTab?.classList.add("hide");
        this.activeTab = newSelected;
        this.activeTab.classList.remove("hide");
        
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