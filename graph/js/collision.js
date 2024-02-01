


class Transform{
    static drag = 1;

    constructor() {
        this.position = new Point();
        this.size = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
    }

    update() {
        this.position.add(this.velocity.add(this.acceleration));
        this.velocity.multiplyScalar(Transform.drag);
    }

    copy() {
        let rez = new Transform();
        rez.position.copy(this.position);
        rez.velocity.copy(this.velocity);
        rez.acceleration.copy(this.acceleration);
    }
}


class PhysicsMode{
    constructor() {
        this.clock;
        this.update = _ => true;
        this.p1 = new Point();
        this.p2 = new Point();

        this.gravity = 10000;
        //this.spring = 0.001;
        this.springIdealLength = 200;
        this.forceUpperBound = 100;
    }
    start(interval) {
        this.clock = setInterval(this.update, interval);
    }
    stop() {
        clearInterval(this.clock);
        this.clock = undefined;
    }
    isRunning() { return !!this.clock; }

    /**
     * @param {NodeUI} a
     * @param {NodeUI} b 
    */
    calculateForces(a, b) {
        let forceA = 0, forceB = 0, dist = 1;
        let mA = a.props.physics?.mass || 1, mB = b.props.physics?.mass || 1;

        this.p1.copy(a.transform.position).sub(b.transform.position);
        dist = this.p1.mag();
        
        if (this.gravity) {
            forceA -= this.gravity * mB / (dist * (dist + 150));
            forceB -= this.gravity * mA / (dist * (dist + 150));
        }
        if (this.spring) {
            forceA += -this.spring * (dist - this.springIdealLength);
            forceB += -this.spring * (dist - this.springIdealLength);
        }
        
        this.p2.copy(this.p1.multiplyScalar(1 / dist));
        if(!a.active)a.transform.acceleration.add(this.p1.multiplyScalar(forceA));
        if(!b.active)b.transform.acceleration.add(this.p2.multiplyScalar(-forceB));
    }
}



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