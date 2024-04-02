class TabArea extends HTMLElement{
    /**@param {MutationRecord[]} mutationList  */
    static mutationCallback(mutationList,observer) {
        for (const mutation of mutationList) {
            let parent = mutation.target.parentElement;
            if (parent.activeHeader || parent.activeTab) return;
            for (const child of mutation.addedNodes) {
                let name = child.getAttribute("for");
                if (name) return parent.selectTab(name);
            }
        }
    }
    static mutationObserver = new MutationObserver(TabArea.mutationCallback);
    static mutationConfig = { childList: true, }
    constructor() {
        super();
        this.scrollBehavior = { behavior: 'smooth', block: 'nearest', inline: 'center' };
        this.openEvent = new CustomEvent("open", { bubbles: true, detail: {} });
    }

    connectedCallback() {
        this.header = this.querySelector(".header");
        this.tabs = this.querySelector(".tabs");
        if (!this.header) this.header = this.appendChild(elementFromHtml("<div class='heafre'></div>"));
        if (!this.tabs) this.tabs = this.appendChild(elementFromHtml("<div class='tabs'></div>"));

        TabArea.mutationObserver.observe(this.header, TabArea.mutationConfig);
        TabArea.mutationObserver.observe(this.tabs, TabArea.mutationConfig);

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