import THREE from '../third_party/three.js';

function RoundedExtrudedPolygonGeometry(radius, length, sides, steps = 1, bevelThickness = .01, bevelSize = .01, bevelSteps = 1 ) {

  var polygonShape = new THREE.Shape();
  polygonShape.moveTo(radius, 0);
  for (let j=0; j<sides; j++) {
    const a = j * 2 * Math.PI / sides;
    const x = radius * Math.cos(a);
    const y = radius * Math.sin(a);
    polygonShape.lineTo(x, y);
  }

  var extrudeSettings = {
    steps: steps,
    amount: length,
    bevelEnabled: true,
    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelSegments: bevelSteps
  };

  const geometry = new THREE.ExtrudeBufferGeometry( polygonShape, extrudeSettings );
  return geometry;

}

export default RoundedExtrudedPolygonGeometry;
