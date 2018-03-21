import THREE from '../third_party/three.js';

function RoundedFlatTorus(radius1, radius2, radius3 ) {

  const cx = radius1;
  const cy = 0;
  const r = .1;
  const pts = [];
  for (let a=0; a<2*Math.PI+.2; a+=.1) {
    const x = Math.pow(Math.abs(Math.cos(a)),.5)*r*Math.sign(Math.cos(a));
    const y = Math.pow(Math.abs(Math.sin(a)),.5)*r*Math.sign(Math.sin(a));
    pts.push(new THREE.Vector3(cx+radius2*x,cy+radius3*y,0));
  }
  const geometry = new THREE.LatheGeometry( pts, 72 );
  geometry.computeVertexNormals();
  geometry.computeFaceNormals();
  geometry.normalsNeedUpdate = true;

  return geometry;
}

export default RoundedFlatTorus;
