import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';
import noise from '../third_party/perlin.js';
import RoundedBoxGeometry from '../third_party/three-rounded-box.js';
import {palette2 as palette} from '../modules/floriandelooij.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

const objects = [];

const NUM = 60;
const geo = new RoundedBoxGeometry(2,2,2,.25,4);
const mat = new THREE.MeshStandardMaterial({color: palette.range[0], metalness: .1, roughness: .5});
const mat2 = new THREE.MeshStandardMaterial({color: palette.range[2], metalness: .1, roughness: .5});
const mat3 = new THREE.MeshStandardMaterial({color: palette.range[4], metalness: .1, roughness: .5});
const mat4 = new THREE.MeshStandardMaterial({color: palette.range[6], metalness: .1, roughness: .5});

for (let j=0; j<NUM; j++) {
  const pivot = new THREE.Group();

  const mesh1 = new THREE.Mesh(geo,mat);
  mesh1.castShadow = mesh1.receiveShadow = true;
  mesh1.scale.setScalar(.1);
  mesh1.rotation.z = Maf.PI / 2;
  pivot.add(mesh1);

  const mesh2 = mesh1.clone();
  mesh2.material = mat2;
  pivot.add(mesh2);

  const mesh3 = mesh1.clone();
  mesh3.material = mat3;
  pivot.add(mesh3);

  const mesh4 = mesh1.clone();
  mesh4.material = mat4;
  pivot.add(mesh4);

  objects.push({meshes: [mesh1, mesh2, mesh3, mesh4], pivot});
  group.add(pivot);
}

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

camera.position.set(0,7,7);
camera.lookAt(new THREE.Vector3(0,0,0));
camera.rotation.z = Math.PI;
renderer.setClearColor(0,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 3;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  objects.forEach( (o, id) => {
    const tt = Maf.mod(t,.25);
    const p = Math.floor(t*4);
    const a = id * Maf.TAU / objects.length;
    const x = 1.5 * Math.cos(a);
    const y = 1.5 * Math.sin(a);

    o.pivot.position.set(x,y,0);
    o.pivot.rotation.z = a;

    o.meshes.forEach( (m, mid) => {

      const a2 = id * Maf.TAU / objects.length + mid * Maf.TAU / 4 + t * Maf.TAU;
      const r2 = .5 + .2 * Math.sin(t*Maf.TAU );
      const x2 = Math.pow(Math.abs(Math.cos(a2)),.75)*r2*Math.sign(Math.cos(a2));
      const y2 = Math.pow(Math.abs(Math.sin(a2)),.75)*r2*Math.sign(Math.sin(a2));
      const e = .2 + .1 * Math.sin(2*t*Maf.TAU + a);
      const e2 = .075 + .025 * Math.cos(2*t*Maf.TAU + a);
      m.rotation.y = -a2 + Maf.PI/2;
      m.scale.set(e2,e,e2);
      m.position.set(x2,0,y2);
    })

  });

  group.rotation.x = Maf.PI / 8 * Math.sin(t*Maf.TAU);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
