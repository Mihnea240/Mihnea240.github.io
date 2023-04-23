
class listLabel {
    constructor(graph) {
        this.parentGraph = graph;
        this.html = document.getElementById("graph-list").content.firstElementChild.cloneNode(true);
        this.name_span = this.html.querySelector(".header> span");
        this.type_button = this.html.querySelector(".header > button")
        this.html.id = graph.id;
        this.html.style.setProperty("--graph-id", graph.id);
        this.hidden = false;

        this.name_span.textContent = " G" + graph.id;
        if (this.parentGraph.type == "Unordered") this.type_button.classList.add("fa-solid", "fa-share-nodes");
        else this.type_button.classList.add("fa-solid", "fa-arrows-to-circle");

        document.getElementById("info-area").appendChild(this.html);

        this.chain_menu = this.html.querySelector(".menu-info .menu.chain");
        this.chain_menu.header = this.chain_menu.querySelector(".header");
        this.chain_menu.info = this.chain_menu.querySelector(".menu-info");

        this.chain_menu.header.querySelector("button").addEventListener("click", (ev) => {
            ev.stopPropagation(); ev.stopImmediatePropagation();
            toggleMenu(ev.target, ev);
            this.getChains();
        });
        this.html.querySelector(".header").addEventListener("dblclick", () => {
            if (this.hidden) return;
            this.scrollIntoView();
            this.parentGraph.select();
        }, false);

        this.html.querySelector(".display-settings .node-slider").addEventListener("input", (event) => {
            let size = event.target.value;
            this.parentGraph.html.style.setProperty("--node-size", size + "px");
            this.parentGraph.nodeSize = size;
            this.parentGraph.updateAll();
        })

        this.html.querySelector(".display-settings .color").addEventListener("input", (event) => {
            this.parentGraph.html.style.setProperty("--neon-color", event.target.value);
        })

        this.html.querySelector(".display-settings .spread-slider").addEventListener("input", (event) => {
            this.parentGraph.html.style.setProperty("--spread-radius", event.target.value)
        })

        this.type_button.addEventListener("click", (ev) => {
            ev.stopPropagation(); ev.stopImmediatePropagation();
            this.hidden = !this.hidden
            this.parentGraph.toggleHide();
            if (this.hidden) {
                this.html.style.opacity = "0.3";
                this.html.children[1].classList.remove("extend-max-height");
            } else {
                this.html.style.opacity = "1.0";
            }
        }, false);

        this.html.querySelector(".select-color select").oninput = (ev) => {
            this.parentGraph.html.classList.toggle("plain");
            this.parentGraph.html.classList.toggle("rainbow");
            toggleMenu(ev.target, null, ev.target.value == "Plain");
        }

        this.html.querySelector(".weight").addEventListener("click", (ev) => {
            let value = ev.target.getAttribute("data-toggle") == "false" ? false : true;
            ev.target.setAttribute("data-toggle", (!value).toString());
            this.parentGraph.isWeighted = !value;
        })

        this.overview = {};
        this.overview.html = this.html.querySelector(".overview");
        this.overview.open_tab = undefined;
        this.overview.header = this.overview.html.querySelector(".header");
        for (const title of this.overview.header.querySelectorAll(" [data-id]")) {
            console.log(title);
            this.overview[title.dataset.id] = {
                title: title,
                content: this.overview.html.querySelector(` .menu-info>[data-id="${title.dataset.id}"]`),
            }
        }


        this.overview.header.querySelector("select").addEventListener("input", ev => {
            this.processID(ev.target.value);
            ev.target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
        });
        this.overview.header.querySelector("select").addEventListener("dblclick", ev => this.processID(this.overview.open_tab));

        this.overview.header.addEventListener("click", (ev) => {
            let id = ev.target.dataset?.id;
            if (id) this.processID(id);
        })

    }
    processID(id) {
        if (!this.overview.open_tab) toggleMenu(this.overview.header);
        if (id == this.overview.open_tab) {
            this.overview[id]?.title.classList.remove("selected");
            toggleMenu(this.overview.header);
            this.overview.open_tab = undefined;
            return;
        }
        this.overview[id].title.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        this.fillOverview(id);
        this.overview[this.overview.open_tab]?.title.classList.remove("selected");
        this.overview[id].title.classList.add("selected");

        this.overview.open_tab ||= id;

        this.overview[this.overview.open_tab].content.style.order = 100;
        this.overview[id].content.style.order = -1;

        this.overview.open_tab = id;
    }

    fillOverview(id) {
        let tab = this.overview[id].content;
        let el = tab.querySelector("textarea");
        let axisOnClick = (ev) => {
            if (ev.target.tagName.toLowerCase() != "span") return;
            let nd = this.parentGraph.node(parseInt(ev.target.textContent));
            if (!nd) return;
            this.focusOn(nd.id);
            selection.push(nd);
        }
        let XaxisTemplate = {
            class1: "Xaxis",
            class2: "line-number",
            direction: "row",
            unit: "1.1vw",
            onclick: axisOnClick,
        }
        let YaxisTemplate = {
            class1: "Yaxis",
            class2: "line-number",
            direction: "column",
            unit: "1.5vw",
            onclick: axisOnClick,
        }

        switch (id) {
            case "Matrix": {
                el.value = matrixToString(matrixFromGraph(this.parentGraph), 1, 1);
                if (!tab.Xaxis && !tab.Yaxis) {
                    XaxisTemplate.slideTarget = YaxisTemplate.slideTarget = el;
                    tab.Xaxis = new numberLine(tab, XaxisTemplate);
                    tab.Yaxis = new numberLine(tab, YaxisTemplate);
                }
                break;
            }
            case "Edge List": {
                el.value = edgeListFromGraph(this.parentGraph);
                break;
            }
            case "Adjacency List": {
                el.value = adjacencyListFromGraph(this.parentGraph);
                if (!tab.Xaxis && !tab.Yaxis) {
                    XaxisTemplate.slideTarget = YaxisTemplate.slideTarget = el;
                    tab.Xaxis = new numberLine(tab, XaxisTemplate);
                    tab.Yaxis = new numberLine(tab, YaxisTemplate);
                }
                break;
            }
            case "Cost Matrix": {
                el.value = matrixToString(costMatrixFromGraph(this.parentGraph), 1, 1).replaceAll("0", "-");
                break;
            }
            case "Parent Array": {
                let root = this.parentGraph.root;
                if (root) {
                    let rez=getParentArrayFromGraph(this.parentGraph, root);
                    rez.splice(0,1); 
                    el.value = rez.join("\n").replaceAll("-1","-");
                    el.parentNode.querySelector("input").value = root;
                }
                if (!tab.init) {
                    tab.init = true;
                    el.parentNode.querySelector("input").addEventListener("input", (ev) => {
                        root = parseInt(ev.target.value) 
                        if (root&&this.parentGraph.node(root)){
                            let rez = getParentArrayFromGraph(this.parentGraph, root);
                            rez.splice(0,1);
                            el.value = rez.join("\n").replaceAll("-1","-");
                        }
                    })
                    YaxisTemplate.slideTarget=el;
                    tab.Yaxis=new numberLine(tab,YaxisTemplate);
                }
                break;
            }
            case "Node Degree": {
                let items = tab.children[0].children;

                if (!tab.initSyncScroll) {
                    tab.initSyncScroll = true;
                    for (const el of items) {
                        el.querySelector("textarea").addEventListener("scroll", (ev) => {
                            for (const e of items) e.querySelector("textarea").scrollTop = ev.target.scrollTop;
                        }, false);
                    }
                }

                if (!tab.Yaxis) {
                    YaxisTemplate.slideTarget = el;
                    tab.Yaxis = new numberLine(tab, YaxisTemplate);
                }

                let force = (this.parentGraph.type == "Unordered");
                items[1].classList.toggle("hide", force);
                items[2].classList.toggle("hide", force);

                let degrees = getNodeDegree(this.parentGraph);
                if (force) {
                    items[0].querySelector("textarea").value = degrees.join("\n");
                    items[0].querySelector("textarea").style.overflowY = "auto"
                    break;
                } else {
                    let s1 = '', s2 = '', s3 = '';
                    for (const val of degrees) {
                        s1 += (val.in + val.out) + '\n';
                        s2 += val.in + '\n';
                        s3 += val.out + '\n';
                    }
                    items[0].querySelector("textarea").value = s1;
                    items[1].querySelector("textarea").value = s2;
                    items[2].querySelector("textarea").value = s3;
                    items[2].querySelector("textarea").style.overflowY = "auto";
                }

                break;
            }
            case "Chain": {
                if(tab.init)break;
                tab.init=true;
                let getc=()=>{
                    let [a,b] = tab.querySelectorAll("input");
                    a=a.value; b=b.value;
                    if(!a&&!b)return;
                    if(a&&b){
                        let chains=this.parentGraph.chains(a,b);
                        el.value=chains
                    }
                }
                tab.querySelectorAll("input[type=number]").forEach((el)=>{
                    el.addEventListener("change",(ev)=>getc());
                })

                break;
            }
            case "Info": {
                break;
            }
        }
    }

    scrollIntoView() {
        let pos = this.parentGraph.center();
        window.scroll({
            top: pos.y - window.innerHeight / 2,
            left: pos.x - window.innerWidth / 2,
            behavior: "smooth"
        })
    }

    focusOn(x, y) {
        if (!x) return false;
        if (!y) {
            this.parentGraph.node(x).html.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            return true
        } else {
            this.parentGraph.edge(x, y).html.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            return true;
        } return false;
    }

    getChains() {
        const [a, b] = this.chain_menu.header.querySelectorAll("input");
        let chains = this.parentGraph.chains(a.value, b.value);
        this.chain_menu.info.textContent = "";
        if (!chains) {
            a.value = b.value = "";
            alert("Input invalid");
            return;
        }

        this.chain_menu.header.querySelector("button").classList.toggle("chain-menu-play");

        this.chain_menu.info.appendChild(elementFromHtml(`<div style="background: inherit;">\
        <span>Count -${chains.length} </span>\
        <button style="position:absolute;  right:2px;"><i class="fa-solid fa-filter"></i></button> </div>`));


        for (const x of chains) {
            let chain_div = elementFromHtml(`<div tabindex="-1">${x}<div>`);
            chain_div.onfocus = (ev) => {
                selection.clear();
                ev.stopImmediatePropagation(); ev.stopPropagation();

                let nodes = ev.target.textContent.split(",");
                for (let i = 0; i < nodes.length - 1; i++) {
                    selection.push(this.parentGraph.node(nodes[i]));
                    selection.push(this.parentGraph.edge(nodes[i], nodes[i + 1]));
                }
                let last = nodes[nodes.length - 1];
                if (nodes[0] != last) selection.push(this.parentGraph.node(last));
                this, this.scrollIntoView();

            }
            chain_div.onfocusout = () => selection.clear;
            this.chain_menu.info.appendChild(chain_div);
        }
    }

    update() {
        this.chain_menu.info.classList.remove("extend-max-height");
    }
}


class Graph {
    static count = 0;
    constructor(input, input_type, graph_type) {
        this.type = graph_type;
        this.nodes = {};
        this.id = (++Graph.count);
        this.html = elementFromHtml(`<div id="g${this.id}" class="default rainbow" draggable="false"></div>`);
        this.nodeSize = parseFloat(getComputedStyle(document.getElementById("defaultInfo")).getPropertyValue("--node-size"));
        this.label = new listLabel(this);
        this._isWeighted = false;

        this.readImput(input, input_type);

        if (input_type == "Parent array") {

            this.node(this.root).position(window.innerWidth / 2, 60);

            let fr = new Array(this.getLastID() + 1).fill(0), queue = [this.root];
            (() => {
                const PI = Math.PI;
                let height = 400
                fr[this.root]++;
                while (queue.length) {
                    let top = this.node(queue[0]);
                    queue.splice(0, 1);

                    let n = top.getDegree();
                    if (n.out != undefined) n = n.out;
                    let p = top.position();
                    let tetha = PI / (n + 1), angle = PI;

                    //console.log(top.id,n,tetha*180/PI);

                    for (const x in top.list) {
                        if (fr[x]) continue;
                        angle += tetha;
                        //console.log(angle*180/PI);
                        this.node(x).position(p.x + height * Math.cos(angle), p.y + height);
                        fr[x]++;
                        queue.push(x);
                    }
                }
            })()


        } else for (const i in this.nodes) {
            this.nodes[i].position(
                window.scrollX + 300 + Math.random() * (window.innerWidth - 300),
                window.scrollY + 300 + Math.random() * (window.innerHeight - 300)
            );
        }

        document.getElementById("container").appendChild(this.html);
    }

    set isWeighted(val) {
        val = !!val;
        this._isWeighted = true;
        this.html.querySelectorAll(".edge span").forEach(el => el.classList.toggle("hide", !val));
    }
    get isWeighted() {
        return this._isWheighted;
    }

    readImput(input, input_type) {
        let m = input.split("\n").filter(x => x !== '').map(x => x.split(" ").filter(x => x !== ''));

        if (input_type == "Matrix") {
            if (!m.length) return 0;
            let size_check = m[0].length;
            for (let i = 0; i < m.length; i++)this.nodes[i + 1] = new Node(i + 1, this);
            for (let i = 0; i < m.length; i++) {
                if (m[i].length != size_check) {
                    alert("Input is not a matrix");
                    return 0;
                }

                for (let j = 0; j < m[i].length; j++) {
                    if (m[i][j] != 0) this.addEdge(i + 1, j + 1);
                }
            }
        } else if (input_type == "") {
        } else if (input_type == "Nr. of nodes & list of edges") {
            let n = parseInt(m[0][0]);
            if (!n) {
                alert("Nr. of nodes is invalid");
                return 0;
            }
            for (let i = 1; i <= n; i++)this.nodes[i] = new Node(i, this);
            for (let i = 1; i < m.length; i++) {
                let x = parseInt(m[i][0]);
                let y = parseInt(m[i][1]);
                if (!x || !y) {
                    alert("Input nodes are not numbers");
                    return 0;
                }
                this.addEdge(x, y);
            }
        } else if (input_type == "Parent array") {
            for (const x of m[0]) this.addNode();
            for (let i = 0; i < m[0].length; i++) {
                if (m[0][i] != '0') this.addEdge(parseInt(m[0][i]), i + 1);
                else this.root = i + 1;
            }
        }
    }


    updateEdge(id) {
        if (!this.node(id)) return;
        for (const key in this.nodes[id].list) this.nodes[id].list[key].updateLine();
        for (const key in this.nodes) this.nodes[key].list[id]?.updateLine();
    }

    updateAll() {
        for (const key in this.nodes)
            for (const key1 in this.nodes[key].list) this.nodes[key].list[key1].updateLine();
    }

    removeNode(node) {
        if (node.name == "Number") {
            this.nodes[node]?.delete();
        } else if (node.name == "Node") node.delete();
    }

    addNode() {
        let index = 1;
        for (const x in this.nodes) {
            if (parseInt(x) != index) break;
            index++;
        } this.label.update();
        return this.nodes[index] = new Node(index, this);
    }

    addEdge(i1, i2) {
        if (!this.node(i1) || !this.node(i2) || this.edge(i1, i2) || i1 == i2) return;
        let ed = new Edge(i1, i2, this);
        this.nodes[i1].list[i2] = ed;
        if (this.type == "Unordered") this.nodes[i2].list[i1] = ed;
        this.label.update();
        return ed;
    }

    removeEdge(i1, i2) {
        if (!this.edge(i1, i2)) return;
        this.nodes[i1].list[i2].delete();
    }

    edge(i1, i2) {
        return this.nodes[i1]?.list[i2];
    }

    node(i) {
        return this.nodes[i];
    }

    delete() {
        document.getElementById("container").removeChild(this.html);
        document.getElementById("info-area").removeChild(this.label.html);
        delete graphs[this.id];
    }

    name(name) {
        if (!name) return this.label.name_span.textContent;
        this.label.name_span.textContent = name;
        return name;
    }

    toggleHide(force) {
        this.html.classList.toggle("hide", force);
    }

    chains(n1, n2) {
        if (!this.node(n1) && !this.node(n2)) return undefined;
        let sol = [], rez = [], fr = new Array(this.nodeCount() + 1).fill(0), isSol;
        
        if (n1 == n2) {
            isSol = (node) => {
                if (fr[node] != 2 || sol.length < 2) return false;
                if (node == n2) return true;
                return false;
            }
        }
        else isSol = (node) => { return fr[node] == 1 && node == n2 };

        let dfs = (node) => {
            sol.push(node); fr[node]++;
            if (isSol(node)) {
                rez.push(Array.from(sol));
                return;
            }
            if (fr[node] > 1) return;

            for (const x in this.nodes[node].list) {
                dfs(parseInt(x));
                sol.pop(); fr[parseInt(x)]--;
            }
        }
        dfs(n1);
        console.log(rez);
        return rez;
    }

    center() {
        let rez = { x: 0, y: 0 }, n = this.nodeCount();
        for (const key in this.nodes) {
            let pos = this.nodes[key].position();
            rez.x += pos.x; rez.y += pos.y;
        }
        rez.x /= n; rez.y /= n;
        return rez;
    }

    getLastID() {
        let a = Object.keys(this.nodes);
        return parseInt(a[a.length - 1]);
    }

    edgeCount() {
        let rez = 0;
        for (const key in this.nodes)
            rez += Object.keys(this.nodes[key]).length;
    }

    nodeCount() {
        return Object.keys(this.nodes).length;
    }

    grade(id, out) {
        if (!this.node(id)) return;
        if (out) {
            let rez = 0;
            for (const key in this.nodes)
                if (this.nodes[key].list[id]) rez++;
        }
        return Object.keys(this.node(id).list);
    }

    select() {
        this.toggleHide();
        for (const key in this.nodes) {
            selection.push(this.nodes[key]);
            for (const k1 in this.nodes[key].list) selection.push(this.edge(key, k1));
        }
        this.toggleHide();
    }
}


class Edge {
    constructor(i1, i2, parent, weight = 1) {
        this.parent = i1;
        this.son = i2;
        this.parentGraph = parent;
        this._weight = weight;
        this.tracker = new Tracker();
        this.html = this.tracker.html;

        let number = elementFromHtml(`<span class="hide" contenteditable="true" 
            onkeypress="restrictInput(event)" 
            onfocusout="this.textContent ||=0">${this.weight}</span>`
        );
        this.html.appendChild(number);
        number.addEventListener("input", (ev) => this.weight = parseFloat(number.textContent));
        this.arrow = elementFromHtml(`<div class="fa-solid fa-play" style="color: var(--background); font-size:inherit;" draggable="false"></div>`);
        if (this.parentGraph.type == "Ordered") this.html.appendChild(this.arrow);

        this.html.addEventListener("mouseover", (event) => {
            let timer, el, r = this.parentGraph.nodeSize;
            let move = (ev) => {
                if (timer) clearTimeout(timer);
                if (el) el.style.display = "hidden";
                timer = setTimeout(() => {
                    let offset = { x: random(-r, 0), y: random(-r, 0) };
                    if (!el)
                        this.parentGraph.html.appendChild(
                            el = elementFromHtml(`<div style="z-index:900; transform:translate(-100%,-100%); position:absolute; paddin: 5px; border: 1px double var(--neon-color); color: var(--background)"></div>`)
                        );
                    el.style.cssText += `display: flex; opacity:1; width:max-content; left: ${ev.pageX + offset.x}px; top: ${ev.pageY + offset.y}px;`;
                    el.textContent = this.parentGraph.name() + "  :  " + this.parent + "  -  " + this.son;
                    el.animate([{ opacity: 0 }, { opacity: 1 }], 200);
                }, 1000);
            }
            this.html.addEventListener("mousemove", move);
            this.html.addEventListener("mouseout", () => {
                clearTimeout(timer);
                if (el) {
                    el.getAnimations().forEach((x) => x.cancel())
                    this.parentGraph.html.removeChild(el);
                    el = undefined;
                }
                this.html.removeEventListener("mousemove", move);
            }, { once: true });
        })

        let pos = { x: 0, y: 0 }, tracker = new Tracker();
        addCustomDrag(this.html, {
            onstart: (ev) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();

                let r = this.parentGraph.nodeSize / 2;

                tracker.distance_offset = 2 * r; tracker.offset = { x: r, y: r };
                this.parentGraph.html.appendChild(tracker.html);

                pos = { x: ev.pageX, y: ev.pageY };
                return true;
            },
            onmove: (ev, delta) => {
                this.html.classList.add("hide");
                let p = this.parentGraph.node(this.parent).position();
                let r = this.parentGraph.nodeSize;
                tracker.update(p, { x: ev.pageX - r, y: ev.pageY - r });
            },
            onend: (ev) => {
                let r = this.parentGraph.nodeSize / 2;
                if(Math.abs(pos.x - ev.pageX) <= 2 && Math.abs(pos.x - ev.pageX) <= 2){
                    if (ev.which == 3) {
                        this.html.classList.remove("hide");
                        ev.preventDefault();
                        selection.push(this);
                    }
                    return true;    
                }
                
                this.parentGraph.html.removeChild(tracker.html);
                if (ev.target.classList[0] == "node") {
                    this.parentGraph.addEdge(this.parent, parseInt(ev.target.textContent));
                    selection.clear();
                } else {
                    let i = this.parentGraph.addNode();
                    this.parentGraph.addEdge(this.parent, i.id);
                    i.position(ev.pageX - r, ev.pageY - r);
                }
                this.delete();
                return true;

            }
        })

        this.html.addEventListener("contextmenu", (ev) => ev.preventDefault());


        this.updateLine();
        this.parentGraph.html.appendChild(this.html);
    }

    set weight(val) {
        this._weight = val;
        this.html.querySelector("span").textContent = this.weight;
    }
    get weight() {
        return this._weight;
    }

    updateLine() {
        let i1 = this.parentGraph.node(this.parent);
        let i2 = this.parentGraph.node(this.son);
        let r = this.parentGraph.nodeSize / 2;
        this.tracker.distance_offset = 2 * r;
        this.tracker.offset = { x: r, y: r };
        let info = this.tracker.update(i1.position(), i2.position());

        if (info.length < 3) this.arrow.classList.add("hide");
        else this.arrow.classList.remove("hide");

    }

    delete() {
        if (!this.parentGraph.edge(this.parent, this.son)) return;
        this.parentGraph.html.removeChild(this.html);
        delete this.parentGraph.node(this.parent).list[this.son];
        if (this.parentGraph.type == "Unordered")
            delete this.parentGraph.node(this.son).list[this.parent];
    }
}



class Node {
    constructor(id, parent) {
        this.parentGraph = parent;
        this.id = id;
        this.pos = { x: 0, y: 0 };
        this.list = {};

        this.html = elementFromHtml(`<div class="node neon" contenteditable="false">${id}</div>`);


        this.html.ondragstart = function () { return false };

        let tracker = new Tracker();

        let pos = { x: 0, y: 0 };
        addCustomDrag(this.html, {
            onstart: (ev) => {
                ev.stopPropagation(); ev.stopImmediatePropagation();
                if (ev.which == 3) {
                    pos = { x: ev.pageX, y: ev.pageY };
                    let r = this.parentGraph.nodeSize / 2;
                    tracker.distance_offset = 2 * r;
                    tracker.offset = { x: r, y: r };
                    this.parentGraph.html.appendChild(tracker.html);
                    ev.preventDefault();
                }
                return true;
            },
            onmove: (ev, delta) => {
                ev.stopImmediatePropagation(); ev.stopPropagation();

                if (ev.which == 1) this.position(delta.x + this.pos.x, delta.y + this.pos.y);
                else if (ev.which == 2) {
                    this.parentGraph.toggleHide();
                    for (const nd of selection.nodes) {
                        let p = nd.position();
                        nd.position(delta.x + p.x, delta.y + p.y);
                    }
                    this.parentGraph.toggleHide();
                } else if (ev.which == 3) {
                    let r = this.parentGraph.nodeSize / 2;
                    tracker.update(this.position(), { x: ev.pageX - r, y: ev.pageY - r });
                }
            },
            onend: (ev) => {
                if (ev.which != 3) return true;
                let r = this.parentGraph.nodeSize / 2;

                ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();

                if (Math.abs(pos.x - ev.pageX) <= r && Math.abs(pos.y - ev.pageY) <= r) {
                    selection.push(this);
                    return true;
                }

                this.parentGraph.html.removeChild(tracker.html);

                if (ev.target.classList[0] == "node") {
                    this.parentGraph.addEdge(this.id, parseInt(ev.target.textContent));
                    selection.clear();
                } else {

                    let i = this.parentGraph.addNode();
                    this.parentGraph.addEdge(this.id, i.id);
                    i.position(ev.pageX - r, ev.pageY - r);
                }
                return true;
            }
        })
        this.html.addEventListener("contextmenu", (ev) => ev.preventDefault());

        this.html.addEventListener("mouseover", (event) => {
            let timer, el, r = this.parentGraph.nodeSize;
            let move = (ev) => {
                if (timer) clearTimeout(timer);
                if (el) el.style.display = "hidden";
                timer = setTimeout(() => {
                    let offset = { x: random(-r, 0), y: random(-r, 0) };
                    if (!el)
                        this.parentGraph.html.appendChild(
                            el = elementFromHtml(`<div style="z-index:900; transform: translate(-100%,-100%);  position:absolute; paddin: 5px; border: 1px double var(--neon-color); color: var(--background)"></div>`)
                        );
                    el.style.cssText += `display: flex; opacity:1; width:max-content; left: ${ev.pageX + offset.x}px; top: ${ev.pageY + offset.y}px;`;
                    el.textContent = this.parentGraph.name() + "  :  " + this.id;
                    el.animate([{ opacity: 0 }, { opacity: 1 }], 200);
                }, 1000);
            }
            this.html.addEventListener("mousemove", move);
            this.html.addEventListener("mouseout", () => {
                clearTimeout(timer);
                if (el) {
                    el.getAnimations().forEach((x) => x.cancel())
                    this.parentGraph.html.removeChild(el);
                    el = undefined;
                }
                this.html.removeEventListener("mousemove", move);
            }, { once: true });
        })
        this.parentGraph.html.appendChild(this.html);
    }

    position(x, y) {
        if (x && y) {
            let r = this.parentGraph.nodeSize / 2;
            this.pos = { x: x, y: y };
            this.html.style.cssText += `; left: ${this.pos.x}px; top: ${this.pos.y}px`;
            this.parentGraph.updateEdge(this.id);
        }
        return this.pos;
    }

    getDegree() {
        let rez = { out: Object.keys(this.list).length, in: 0 }
        if (this.parentGraph.type == "Unordered") return rez.out;
        for (const key in this.parentGraph.nodes) {
            rez.in += this.parentGraph.edge(key, this.id) ? 1 : 0;
        }
        return rez;
    }

    delete() {
        if (!this.parentGraph.node(this.id)) return;
        this.parentGraph.html.removeChild(this.html);

        for (const key in this.list) this.list[key].delete();

        for (const [key, value] of Object.entries(this.parentGraph.nodes))
            value.list[this.id]?.delete();

        delete this.parentGraph.nodes[this.id];
        if (this.parentGraph.nodeCount() == 0) this.parentGraph.delete();
    }
}

function matrixFromGraph(graph) {
    let n = graph.getLastID(), s = "";
    let mat = getMatrix(n + 1, n + 1);
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= n; j++)mat[i][j] = graph.edge(i, j)?.weight || 0;
        //s += (graph.edge(i, j)) ? "1 " : "0 ";
        //s += "\n";
    }
    return mat;
}

function adjacencyListFromGraph(graph) {
    let s = "";
    for (const x in graph.nodes)
        s += Object.keys(graph.nodes[x].list).join(" ") + "\n";
    return s;
}

function edgeListFromGraph(graph) {
    let n = graph.getLastID(), s = n + "\n";
    for (const key in graph.nodes) {
        for (const k in graph.nodes[key].list) s += `${key} ${k}\n`;
    }
    return s;
}

function costMatrixFromGraph(graph) {
    let n = graph.getLastID();
    let mat = matrixFromGraph(graph);

    for (let k = 1; k <= n; k++) {
        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= n; j++) {
                if (mat[i][k] && mat[k][j - 1]) mat[i][j] = Math.min(mat[i][j], mat[i][k] + mat[k][j]);
            }
        }
    }
    return mat;
}

function getNodeDegree(graph) {
    let rez = [];
    for (const nd in graph.nodes) rez.push(graph.nodes[nd].getDegree());
    return rez;
}

function getParentArrayFromGraph(graph, root) {
    let n = graph.getLastID(), queue = [root];
    let rez = new Array(n).fill(-1);
    rez[root]=0;

    while (queue.length) {
        let top = queue[0];
        queue.splice(0, 1);
        for (let x in graph.node(top).list) {
            x=parseInt(x);
            rez[x] = top;
            queue.push(x);
        }
    }
    return rez;
}