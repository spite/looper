import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import easings from '../modules/easings.js';
import RoundedFlatTorus from '../modules/three-rounded-flat-torus.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();
const circle = new THREE.Group();

const material = new THREE.MeshStandardMaterial({metalness: .1, roughness: .1});
const material2 = new THREE.MeshStandardMaterial({metalness: .1, roughness: .1});
material.color.setHSL(1.,.75,.45);
material2.color.setHSL(.8,.75,.5);
const geo = RoundedFlatTorus(1,2,4);
const geo2 = RoundedFlatTorus(.5,1.5,4);

const objects = [];
const SIZE = 12;
const STEP = 3;
for (let y=-SIZE; y<SIZE; y+=STEP) {
  for (let x=-SIZE; x<SIZE; x+=STEP) {
    const mesh = new THREE.Mesh(geo, material);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x+.5*STEP,y+.5*STEP,0);
    group.add(mesh);
    const offset = Math.PI*(x+SIZE + y+SIZE)/(2*SIZE);

    const mesh2 = new THREE.Mesh(geo2, material2);
    mesh2.castShadow = mesh2.receiveShadow = true;
    mesh2.rotation.x = Math.PI / 2;
    mesh2.position.set(x+.5*STEP,y+.5*STEP,-1);
    group.add(mesh2);

    objects.push({x,y,mesh, mesh2,offset});

  }
}
scene.add(group);

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

camera.position.set(0,0,19);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 1.5;

function draw(startTime) {

  objects.forEach( o => {
    const time = ( .001 * (performance.now()-startTime)) % loopDuration;
    if(time<.5*loopDuration) {
      const f = easings.InOutExpo(time / (.5*loopDuration));
      if(o.y%2===0) {
        if(o.x%2===0) {
          o.mesh.position.x = o.x + .5 * STEP + f * STEP;
          o.mesh.rotation.z = -f * Math.PI;
          o.mesh2.position.x = o.x + .5 * STEP - f * STEP;
          o.mesh2.rotation.z = f * Math.PI;
        }
        if(o.x%2!==0) {
          o.mesh.position.y = o.y + .5 * STEP + f * STEP;
          o.mesh.rotation.x = .5 * Math.PI - f * Math.PI;
          o.mesh2.position.y = o.y + .5 * STEP - f * STEP;
          o.mesh2.rotation.x = .5 * Math.PI + f * Math.PI;
        }
      } else {
        if(o.x%2!==0) {
          o.mesh.position.x = o.x + .5 * STEP - f * STEP;
          o.mesh.rotation.z = f * Math.PI;
          o.mesh2.position.x = o.x + .5 * STEP + f * STEP;
          o.mesh2.rotation.z = -f * Math.PI;
        }
        if(o.x%2===0) {
          o.mesh.position.y = o.y + .5 * STEP - f * STEP;
          o.mesh.rotation.x = .5 * Math.PI + f * Math.PI;
          o.mesh2.position.y = o.y + .5 * STEP + f * STEP;
          o.mesh2.rotation.x = .5 * Math.PI - f * Math.PI;
        }
      }
    } else {
      const f = easings.InOutExpo((time - .5*loopDuration) / (.5*loopDuration));
      if(o.y%2!==0) {
        if(o.x%2!==0) {
          o.mesh.position.x = o.x + .5 * STEP + f * STEP;
          o.mesh.rotation.z = -f * Math.PI;
          o.mesh2.position.x = o.x + .5 * STEP - f * STEP;
          o.mesh2.rotation.z = f * Math.PI;
        }
        if(o.x%2===0) {
          o.mesh.position.y = o.y + .5 * STEP + f * STEP;
          o.mesh.rotation.x = .5 * Math.PI - f * Math.PI;
          o.mesh2.position.y = o.y + .5 * STEP - f * STEP;
          o.mesh2.rotation.x = .5 * Math.PI + f * Math.PI;
        }
      } else {
        if(o.x%2===0) {
          o.mesh.position.x = o.x + .5 * STEP + f * STEP;
          o.mesh.rotation.z =- f * Math.PI;
          o.mesh2.position.x = o.x + .5 * STEP - f * STEP;
          o.mesh2.rotation.z = f * Math.PI;
        }
        if(o.x%2!==0) {
          o.mesh.position.y = o.y + .5 * STEP + f * STEP;
          o.mesh.rotation.x = .5 * Math.PI -  f * Math.PI;
          o.mesh2.position.y = o.y + .5 * STEP - f * STEP;
          o.mesh2.rotation.x = .5 * Math.PI + f * Math.PI;
        }
      }
    }
    o.mesh.rotation.set(Math.PI / 2,0,0);
    o.mesh2.rotation.set(Math.PI / 2,0,0);
  })

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
