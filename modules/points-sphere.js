import THREE from '../third_party/three.js';

function pointsOnSphere(n) {

    const pts = [];
    const inc = Math.PI * (3 - Math.sqrt(5));
    const off = 2.0 / n;
    let r;
    var phi;
    let dmin = 10000;
    const prev = new THREE.Vector3();
    const cur = new THREE.Vector3();

    for (var k = 0; k < n; k++){
        cur.y = k * off - 1 + (off /2);
        r = Math.sqrt(1 - cur.y * cur.y);
        phi = k * inc;
        cur.x = Math.cos(phi) * r;
        cur.z = Math.sin(phi) * r;

        const dist = cur.distanceTo( prev );
        if( dist < dmin ) dmin = dist;

        pts.push(cur.clone());
        prev.copy( cur );
    }

    return pts;
}

export default pointsOnSphere;
