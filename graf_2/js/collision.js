function AABB(rect1,rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}


function visibleElements(graph) {
    let viewRect = graph.tab.viewRect, rez = [];
    let p = new Point();
    let { top, left } = graph.tab.rect;
    let zoom = graph.settings.graph.zoom;
    let { scrollLeft, scrollTop } = graph.tab.tab;
    for (let el of graph.tab.children) {
        let rect = {};
        if (el.tagName == "GRAPH-NODE") {
            rect = {
                x: el.transform.position.x,
                y: el.transform.position.y,
                width: el.transform.size.x,
                height: el.transform.size.y,
            }
        } else if (el.tagName == "GRAPH-EDGE") {
            let r = el.getBoundingClientRect();
            console.log(zoom);
            p.set(r.x, r.y).translate(scrollLeft - left/zoom, scrollTop - top/zoom  );
            rect = {
                x: p.x,
                y: p.y,
                width: r.width,
                height: r.height
            }
        } else continue;
        
        if (AABB(viewRect, rect)) rez.push([el, rect]);
    }
    return rez;
}


class Transform{
    static drag = 1

    constructor() {
        this.position = new Point();
        this.size = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
    }

    update() {
        this.position.add(this.velocity.add(this.acceleration.multiplyScalar(Transform.drag)));
    }
}


class PhysicsMode{
    constructor() {
        this.clock;
        this.update = _ => true;
    }
    start(nodeList,interval) {
        this.clock = setInterval(this.update, interval);
    }
    stop() {
        clearInterval(this.clock);
        this.clock = undefined;
    }
    isRunning() { return !!this.clock; }
}