import THREE from '../third_party/three.js';

function RoundedCylinderGeometry(radius, length, bevelSize, bevelSteps, steps = 1 ) {

  var circleRadius = radius;
  var circleShape = new THREE.Shape();
  circleShape.moveTo( 0, circleRadius );
  circleShape.quadraticCurveTo( circleRadius, circleRadius, circleRadius, 0 );
  circleShape.quadraticCurveTo( circleRadius, - circleRadius, 0, - circleRadius );
  circleShape.quadraticCurveTo( - circleRadius, - circleRadius, - circleRadius, 0 );
  circleShape.quadraticCurveTo( - circleRadius, circleRadius, 0, circleRadius );

  var extrudeSettings = {
    steps: steps,
    amount: length,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize: bevelSize,
    bevelSegments: bevelSteps
  };

  const geometry = new THREE.ExtrudeBufferGeometry( circleShape, extrudeSettings );
  return geometry;

}

export default RoundedCylinderGeometry;
