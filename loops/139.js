import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedExtrudedPolygonGeometry from '../modules/three-rounded-extruded-polygon.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const SIDES = 36;
const material = new THREE.MeshStandardMaterial({color:0xb70000, metalness: .3, roughness: .2});
const geo = new RoundedExtrudedPolygonGeometry(.25,4,SIDES,1,.1,.25,5);

const S = 10;
const objects = [];

for (let y=-S; y<S+1; y++) {
  for (let x=-S; x<S+1; x++) {
    const dx = x;
    const dy = (dx % 2)?y:y-.5;
    const d = Math.sqrt(dx*dx+dy*dy);
    if(d<=S) {
      const mat = material.clone();
      mat.color.setHSL(Math.atan2(dy,dx)/Maf.TAU,.5,.5);
      const mesh = new THREE.Mesh(
        geo,
        mat
      );
      const pivot = new THREE.Group();
      mesh.position.z = -.375/2;
      mesh.scale.setScalar(1-easings.InQuint(d/S));
      pivot.position.x = dx + .5;
      pivot.position.y = dy + .5;
      mesh.receiveShadow = mesh.castShadow = true;
      mesh.rotation.z = Maf.TAU / (2*SIDES);
      pivot.add(mesh);
      const a = Math.atan2(dy,dx);
      objects.push({pivot,x,y,mat,d,a});
      group.add(pivot);
    }
  }
}
group.scale.setScalar(.1);
group.position.x -= .05;
group.position.y -= .05;
group.rotation.x =- Math.PI / 2;
scene.add(group);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-2,2,2);
directionalLight.castShadow = true;
scene.add( directionalLight );

const directionalLight2 = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight2.position.set(1,2,1);
directionalLight2.castShadow = true;
scene.add( directionalLight2 );

const ambientLight = new THREE.AmbientLight(0x808080, .5);
scene.add(ambientLight);

const light = new THREE.HemisphereLight( 0xcefeff, 0xb3eaf0, .5 );
scene.add( light );

camera.position.set(0,3.5,0);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Math.PI;
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2;
const cameraOffset = new THREE.Vector3();

function myXOR(a,b) {
  return ( a || b ) && !( a && b );
}

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {

    const dx = o.d * Math.cos(o.a+t*Maf.TAU);
    const dy = o.d * Math.sin(o.a+t*Maf.TAU);

    const px = .01 * dx + 10 + .01 * ( .5 + .5 * Math.sin(t * Maf.TAU));
    const py = .01 * dy + 10 + .01 * ( .5 + .5 * Math.sin(t * Maf.TAU));
    const offset = Maf.mod(noise.simplex3(px, px, .1)+t,1.);

    o.pivot.scale.setScalar(.5 + .5 * Math.cos(easings.InOutQuad(offset)*Maf.TAU));
    o.pivot.position.z = 1 - 4 * Math.cos(easings.InOutQuad(offset)*Maf.TAU);
  });

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
