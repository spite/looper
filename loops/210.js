import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {MeshLine, MeshLineMaterial} from '../modules/three-meshline.js';
import Maf from '../modules/maf.js';
import { palette2 as palette } from '../modules/floriandelooij.js';
import { gradientLinear } from '../modules/gradient.js';
import OrbitControls from '../third_party/THREE.OrbitControls.js';

import Painted from '../modules/painted.js';

const painted = Painted(renderer, { minLevel: -.1 });

palette.range = ["#F2E9D9", "#101010", "#EA4B04", "#B6AC9E", "#5A5754", "#837F7A", "#E78E36", "#F2E9D9"];

const gradient = new gradientLinear(palette.range);

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const controls = new OrbitControls(camera, canvas);

const directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
directionalLight.position.set(-1,1,1);
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

camera.position.set(0,20,0);
camera.lookAt(group.position);
renderer.setClearColor(palette.range[0],1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const circleRadius = 2;
const geometry = new THREE.Geometry();
for (let j = 0; j <= 1*Math.PI; j +=Math.PI/72 ) {
  const v = new THREE.Vector3( circleRadius * Math.cos( j ), circleRadius * Math.sin( j ), 0 );
  geometry.vertices.push( v );
}

const resolution = new THREE.Vector2(canvas.width, canvas.height);
const strokeTexture = new THREE.TextureLoader().load( './assets/stroke.png' );

const circles = [];
const SIDES = 36;
for (let i=0; i<SIDES; i++) {
  const line = new MeshLine();
  const material = new MeshLineMaterial( {
    map: strokeTexture,
    useMap: true,
    color: new THREE.Color().setHSL(i/SIDES,1,.5),
    resolution: resolution,
    sizeAttenuation: true,
    lineWidth: 1,
    near: camera.near,
    far: camera.far,
    depthWrite: false,
    depthTest: false,
    transparent: true,
  });
  line.setGeometry( geometry, function( p ) { return p; } );
  const mesh = new THREE.Mesh( line.geometry, material );
  const pivot = new THREE.Group();
  const a = i*2*Math.PI/SIDES;
  const x = 3 * Math.sin(a);
  const z = 3 * Math.cos(a);
  pivot.position.set(x,0,z);
  pivot.rotation.y = a + Math.PI / 2;
  mesh.rotation.z = a;
  pivot.add(mesh);
  group.add(pivot);
  circles.push({mesh, pivot, x, z, a});
}
scene.add(group);

const loopDuration = 4;

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  circles.forEach( (c,id) => {
    c.mesh.rotation.z = - id * Maf.TAU / SIDES + t * Maf.TAU;
    c.mesh.scale.setScalar(.75 + .25 * Math.cos(id*4 * Maf.TAU/SIDES + t*2*Math.PI) )
    c.mesh.rotation.x = .3 * Math.cos(t*Maf.TAU);
    c.mesh.material.uniforms.color.value.copy(gradient.getAt(Maf.mod(id/SIDES,1)));
  });

  painted.render(scene, camera);
}

export { draw, loopDuration, canvas };
