
class listLabel {
    constructor(graph) {
        this.parentGraph = graph;
        this.html = document.getElementById("graph-list").content.firstElementChild.cloneNode(true);
        this.name_span = this.html.querySelector(".header> abbr");
        this.type_button = this.html.querySelector(".header > button")
        this.html.id = graph.id;
        this.html.style.setProperty("--graph-id", graph.id);
        this.hidden = false;

        this.name_span.textContent = " G" + graph.id;
        this.name_span.setAttribute("title",this.name_span.textContent);
        this.name_span.oninput=()=>this.parentGraph.name(this.name_span.textContent);

        if (this.parentGraph.type == "Unordered") this.type_button.classList.add("fa-solid", "fa-share-nodes");
        else this.type_button.classList.add("fa-solid", "fa-arrows-to-circle");

        document.getElementById("info-area").appendChild(this.html);


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
            this.overview[title.dataset.id] = {
                title: title,
                content: this.overview.html.querySelector(` .menu-info>[data-id="${title.dataset.id}"]`),
            }
        }


        this.overview.header.querySelector("select").addEventListener("input", ev => {
            if(ev.target.value=="Inputs")return this.processID(this.overview.open_tab);
            this.processID(ev.target.value);
            ev.target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
            //ev.target.value="Inputs";
        });
        this.overview.header.querySelector("select").addEventListener("dblclick", ev => this.processID(this.overview.open_tab));

        this.overview.header.addEventListener("click", (ev) => {
            let id = ev.target.dataset?.id;
            if (id) {
                this.processID(id);
                this.overview.header.querySelector("select").value="Inputs";
            }
        })

    }

    processID(id) {
        if (!this.overview.open_tab) toggleMenu(this.overview.header);
        if (id == this.overview.open_tab) {
            this.overview[id]?.title.classList.remove("selected");
            this.overview[this.overview.open_tab].content.style.order = 100;
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
            unit: "2.2vh",
            onclick: axisOnClick,
        }
        let YaxisTemplate = {
            class1: "Yaxis",
            class2: "line-number",
            direction: "column",
            unit: "3.0vh",
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
                break;
            }
            case "Cost Matrix": {
                el.value = matrixToString(costMatrixFromGraph(this.parentGraph), 1, 1).replaceAll("0", "-");
                break;
            }
            case "Parent Array": {
                let root = this.parentGraph.root;
                if (root) {
                    let rez = getParentArrayFromGraph(this.parentGraph, root);
                    rez.splice(0, 1);
                    el.value = rez.join("\n").replaceAll("-1", "-");
                    el.parentNode.querySelector("input").value = root;
                }
                if (!tab.init) {
                    tab.init = true;
                    el.parentNode.querySelector("input").addEventListener("input", (ev) => {
                        root = parseInt(ev.target.value)
                        if (root && this.parentGraph.node(root)) {
                            let rez = getParentArrayFromGraph(this.parentGraph, root);
                            rez.splice(0, 1);
                            el.value = rez.join("\n").replaceAll("-1", "-");
                        }else el.value='';
                    })
                    YaxisTemplate.slideTarget = el;
                    tab.Yaxis = new numberLine(tab, YaxisTemplate);
                }
                break;
            }
            case "Transpose List": {
                let rez='',t_graph=transposeList(this.parentGraph);
                for(const k in t_graph)rez+=k+" : "+t_graph[k].join(" ")+"\n";
                el.value=rez;
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
                if (tab.init) break;
                tab.init = true;
                let getc = () => {
                    let [a, b] = tab.querySelectorAll("input");
                    let area = tab.querySelector(".chains-cont"),options={};
                    a = a.value; b = b.value;

                    selection.clear();
                    area.innerHTML = '';
                    options[tab.querySelector("select").value]=true; 
                    

                    let chains = this.parentGraph.chains(a, b,options);
                    if (!chains) return;

                    let doc = new DocumentFragment();
                    doc.appendChild(elementFromHtml(`<div style="border-bottom: 1px solid gray">Size : ${chains.length}</div>`))
                    for (let ch of chains) doc.appendChild(elementFromHtml(`<abbr class="chain" title="Size : ${ch.length - 1} Cost: ${ch.pop()}">${ch.join('-')}</abbr>`));
                    area.appendChild(doc);
                }
                
                tab.addEventListener("click", (ev) => {
                    if (ev.target.classList[0] != "chain") return;

                    if(tab.last_selected)tab.last_selected.classList.remove(".selected")
                    tab.last_selected=ev.target;
                    tab.last_selected.classList.add(".selected");

                    let arr = ev.target.textContent.split("-").map((el) => el = this.parentGraph.node(parseInt(el)));
                    selection.clear();
                    for (let i = 0; i < arr.length - 1; i++) {
                        selection.push(arr[i]);
                        selection.push(this.parentGraph.edge(arr[i].id, arr[i + 1].id));
                    }
                    if (arr[0] != arr.back()) selection.push(arr.pop());
                })
                tab.querySelectorAll("input[type=number]").forEach(el => el.addEventListener("change", () => getc()));
                tab.querySelector("select").onchange=()=>getc();
                break;
            }
            case "Info": {
                let check = `<i class="fa-solid fa-check" style="color: lime; text-shadow: none;"></i>`;
                let x = `<i class="fa-solid fa-x" style="color: red; text-shadow: none;"></i>`;

                let general=tab.querySelector(".type").children;
                general[0].textContent = this.parentGraph.name()+ " : " +this.parentGraph.type;
                general[1].textContent = `Nodes : ${this.parentGraph.nodeCount}`;
                general[2].textContent = `Edges : ${this.parentGraph.edgeCount}`;


                let parts = partition(this.parentGraph);
                let bi = tab.querySelector(".bipartite").children;
                if (parts) {
                    bi[0].innerHTML = `Bipartite  :  ${check}`;
                    bi[1].textContent = parts.A.join("-");
                    bi[2].textContent = parts.B.join("-");
                } else {
                    bi[0].innerHTML = `Bipartite  : ${x}`;
                    bi[1].textContent='';
                    bi[2].textContent='';
                }


                let nd,n=this.parentGraph.nodeCount,m=this.parentGraph.edgeCount;
                for(nd in this.parentGraph.nodes)break;
                let h_chains=this.parentGraph.chains(nd,nd,{isSol: (sol)=>sol.length-1==n});
                tab.querySelector(".hamiltonian").innerHTML = `Hamiltonian : ${(nd&&h_chains.length)?check:x}`;

                let e_chains=this.parentGraph.chains(nd,nd,{isSol: (sol)=>sol.length-1==this.parentGraph.edgeCount})
                tab.querySelector(".eulerian").innerHTML = `Eulerian : ${(nd&&e_chains.length)?check:x}`;

                let comp=this.parentGraph.components();
                tab.querySelector(".conex").innerHTML = `<span>Conex components : ${comp.length}</span>`;
                if(comp){
                    let doc=new DocumentFragment();
                    for(const c of comp){
                        doc.appendChild(elementFromHtml(`<abbr title="Size : ${c.length}" class="component" style="text-decoration: none">${c.join(" ")}</abbr>`));
                    }
                    tab.querySelector(".conex").appendChild(doc);
                    tab.querySelector(".conex").addEventListener("click",(ev)=>{
                        if(ev.target.classList[0]!="component")return;
                        selection.clear();
                        for(const nd of ev.target.textContent.split(" ")){
                            selection.push(this.parentGraph.node(parseInt(nd)));
                        }
                    })
                }
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

    update() {

    }
}


class Graph {
    static count = 0;
    constructor(input, input_type, graph_type) {
        this.type = graph_type;
        this.nodes = {};
        this.nodeCount=0;
        this.edgeCount=0;
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
        } else if (input_type == "Adjacency list") {
            for(const line of m){
                let source=parseInt(line[0]);
                if(!this.node(source))this.nodes[source]=new Node(source,this);
                for(let i=2; i<line.length; i++){
                    let k=parseInt(line[i]);
                    if(!this.node(k))this.nodes[k]=new Node(k,this);
                    this.addEdge(source,k);
                }
            }
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
        this.label.name_span.setAttribute("title",name);
        return name;
    }

    toggleHide(force) {
        this.html.classList.toggle("hide", force);
    }

    chains(n1, n2, { isSol = (sol,fr,cost) => true, simple = false } = {}) {
        if (!this.node(n1) || !this.node(n2)) return undefined;
        let nr=this.type=="Ordered"?2:3, sol = [], rez = [], fr = new Map(), cost = 0;

        let check = (n1 == n2) ? ((node) => (sol.length > nr && node == n2)) : ((node) => node == n2);
        let add = (simple) ? (i, j) =>i + '|' + j  : (i, j) => j;

        let dfs = (node) => {

            sol.push(node);
            let v = add(sol.back(1), node); 
            fr.set(v, (fr.get(v) || 0) + 1);

            if (check(node)) {
                if (!isSol(sol, fr, cost)) return;
                sol.push(cost);
                rez.push(Array.from(sol));
                sol.pop();
                return;
            }
           
            if (fr.get(v) > 1) return;


            for (let x in this.nodes[node].list) {
                x = parseInt(x);

                cost += this.edge(node, x)?.weight;
                dfs(x);

                sol.pop();
                let v = add(node, x);
                fr.set(v, fr.get(v) - 1);
                cost -= this.edge(node, x)?.weight;

            }
        }
        dfs(parseInt(n1));
        return rez;
    }

    components(){
        let fr=new Array(this.getLastID()+1).fill(0),val=0,rez=[];

        if(this.type=="Unordered"){
            let dfs =(node)=>{
                fr[node]=val;
                for(let k in this.node(node).list){
                    k=parseInt(k);
                    if(fr[k]==0)dfs(k);
                }
            }
            for(let k in this.nodes){
                k=parseInt(k);
                if(!fr[k]){
                    val++; rez.push([]);
                    dfs(k);
                }
            }
            for(let k in this.nodes){
                k=parseInt(k);
                rez[fr[k]-1].push(k);
            }
            return rez;
        }
        if(this.type=="Ordered"){
            let stack=[], transpose_graph=transposeList(this);
            let fr=new Array(this.getLastID()+1).fill(0),val=0,rez=[];
            let dfs1=(node)=>{
                fr[node]++;
                for(let k in this.node(node).list){
                    k=parseInt(k);
                    if(!fr[k])dfs1(k);
                }
                stack.push(node);
            }
            let dfs2=(node)=>{
                fr[node]++;
                rez[val-1].push(node);
                if(!transpose_graph[node])return;
                for(let k of transpose_graph[node]){
                    k=parseInt(k);
                    if(!fr[k])dfs2(k);
                }
            }

            for(let nd in this.nodes){
                nd=parseInt(nd);
                if(!fr[nd])dfs1(nd);
            }
            fr.fill(0);
            for(let i=stack.length-1; i>=0; i--){
                if(fr[stack[i]])continue;
                val++; rez.push([]);
                dfs2(stack[i]);
            }
            return rez;
        }

    }

    center() {
        let rez = { x: 0, y: 0 }, n = this.nodeCount;
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

    select() {
        this.toggleHide();
        for (const key in this.nodes) {
            selection.push(this.nodes[key]);
            for (const k1 in this.nodes[key].list) selection.push(this.edge(key, k1));
        }
        this.toggleHide();
    }

    copy() {
        let r = this.nodeSize * 3;
        //let offset={x:random(-r,r), y: random(-r,r)};
        let n = new Graph(edgeListFromGraph(this), "Nr. of nodes & list of edges", this.type);
        graphs[n.id] = n;

        let offset = this.center();
        offset.x = window.scrollX + window.innerWidth / 2 - offset.x;
        offset.y = window.scrollY + window.innerHeight / 2 - offset.y;

        for (const key in this.nodes) {
            let p = this.node(key).position();
            p.x += offset.x; p.y += offset.y;

            n.node(key).position(p.x, p.y);
        }

        return n;
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
        this.parentGraph.edgeCount++;

        let number = elementFromHtml(`<span class="hide" contenteditable="true" 
            onkeypress="restrictInput(event)" 
            onfocusout="this.textContent ||= 0">${this.weight}</span>`
        );
        this.html.appendChild(number);
        number.addEventListener("input", (ev) => this.weight = parseFloat(number.textContent));

        if(this.parentGraph.type == "Ordered") this.html.appendChild(
            this.arrow=elementFromHtml(`<div class="fa-solid fa-play" style="color: var(--background); font-size:inherit;" draggable="false"></div>`)
        );

        
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
                if (ev.detail != 2) return false;
                ev.stopPropagation(); ev.stopImmediatePropagation();
                pos = { x: ev.pageX, y: ev.pageY };
                let r = this.parentGraph.nodeSize / 2;
                tracker.distance_offset = 2 * r; tracker.offset = { x: r, y: r };
                tracker.html.classList.add("hide");
                this.parentGraph.html.appendChild(tracker.html);
                return true;
            },
            onmove: (ev, delta) => {
                this.html.classList.add("hide");
                tracker.html.classList.remove("hide");
                let p = this.parentGraph.node(this.parent).position();
                let r = this.parentGraph.nodeSize / 2;
                tracker.update(p, { x: ev.pageX - r, y: ev.pageY - r });
            },
            onend: (ev) => {
                let r = this.parentGraph.nodeSize / 2;
                this.parentGraph.html.removeChild(tracker.html);
                this.html.classList.remove("hide");
                if ((pos.x - ev.pageX) ** 2 + (pos.y - ev.pageY) ** 2 < 2) {
                    if (ev.which == 3) {
                        ev.preventDefault();
                        selection.push(this);
                    }
                    return true;
                }


                if (ev.target.classList[0] == "node") {
                    let id = parseInt(ev.target.textContent);
                    if (id == this.son) return true;
                    this.parentGraph.addEdge(this.parent, id);
                    selection.clear();
                } else {
                    let i = this.parentGraph.addNode();
                    this.parentGraph.addEdge(this.parent, i.id);
                    i.position(ev.pageX - r, ev.pageY - r);
                }
                this.parentGraph.removeEdge(this.parent,this.son);
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

        if (info.length < 3) this.arrow?.classList.add("hide");
        else this.arrow?.classList.remove("hide");

    }

    delete() {
        if (!this.parentGraph.edge(this.parent, this.son)) return;
        this.parentGraph.html.removeChild(this.html);
        delete this.parentGraph.node(this.parent).list[this.son];
        this.parentGraph.edgeCount--;
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
        this.parentGraph.nodeCount++;

        this.html = elementFromHtml(`<div class="node neon">${id}</div>`);


        this.html.ondragstart = function () { return false };

        let tracker = new Tracker();

        let pos = { x: 0, y: 0 };
        addCustomDrag(this.html, {
            onstart: (ev) => {
                ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
                if (ev.which == 3) {
                    pos = { x: ev.pageX, y: ev.pageY };
                    let r = this.parentGraph.nodeSize / 2;
                    tracker.distance_offset = 2 * r;
                    tracker.offset = { x: r, y: r };
                    tracker.html.classList.add("hide");
                    this.parentGraph.html.appendChild(tracker.html);
                    ev.preventDefault();
                }
                return true;
            },
            onmove: (ev, delta) => {
                ev.stopImmediatePropagation(); ev.stopPropagation();
                tracker.html.classList.remove("hide");
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

                this.parentGraph.html.removeChild(tracker.html);
                tracker.html.classList.remove("hide");
                if (Math.abs(pos.x - ev.pageX) <= r && Math.abs(pos.y - ev.pageY) <= r) {
                    selection.push(this);
                    return true;
                }


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
        return { x: this.pos.x, y: this.pos.y };
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
        this.parentGraph.nodeCount--;

        for (const key in this.list) this.list[key].delete();

        for (const [key, value] of Object.entries(this.parentGraph.nodes))
            value.list[this.id]?.delete();

        delete this.parentGraph.nodes[this.id];
        if (this.parentGraph.nodeCount == 0) this.parentGraph.delete();
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
    for (const x in graph.nodes){
        let l=graph.nodes[x].list;
        if(l!={}) s +=x+" : "+ Object.keys(graph.nodes[x].list).join(" ") + "\n";
    }
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
    let rez = new Array(n+1).fill(-1);
    rez[root] = 0;

    while (queue.length) {
        let top = queue[0];
        queue.splice(0, 1);
    
        for (let x in graph.node(top).list) {
            x = parseInt(x);
            if(rez[x]!=-1)continue;
            rez[x] = top;
            queue.push(x);
        }
    }
    return rez;
}

function partition(graph) {
    let n = graph.getLastID();
    if (graph.nodeCount < 2) return false;
    let fr = new Array(n + 1).fill(0);

    let dfs = (node) => {
        let val = fr[node] == 1 ? 2 : 1;
        for (let x in graph.node(node).list) {
            x = parseInt(x);
            if (fr[x] == val) continue;
            if (fr[x]) return false;
            fr[x] = val;
            if(dfs(x)==false)return false;
        }
    }

    for (let x in graph.nodes) {
        x = parseInt(x);
        if (fr[x]) continue;
        fr[x] = 1;
        if (dfs(x) != undefined) return false;
    }

    let A = [], B = [];
    for (let i = 1; i <= n; i++) {
        if (fr[i] == 1) A.push(i);
        else if(fr[i]==2)B.push(i);
    }
    console.log(A,B);
    if (!A.length || !B.length) {
        A = []; B = [];
        let r = parseInt(random(2, graph.nodeCount - 1)),i=0;
        console.log(r);
        for (let key in graph.nodes) {
            key=parseInt(key);
            if (i++ < r) A.push(key);
            else B.push(key);
        }
    }
    return {
        A: A,
        B: B
    }

}

function transposeList(graph){
    if(graph.type!="Ordered")return;
    let list={};
    for(let k in graph.nodes){
        for(const edge in graph.node(k).list){
            if(list[edge])list[edge].push(k);
            else list[edge]=[k];
        }
    }
    return list;

} 