import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({color: 0x5186a6, metalness: .1, roughness: .5});
  material.onBeforeCompile = (shader) =>{
    material.uniforms = shader.uniforms;
    shader.uniforms.time = { value: 0 };

    shader.vertexShader = shader.vertexShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;`);
    shader.vertexShader = shader.vertexShader.replace(
      `#include <defaultnormal_vertex>`,
      `#include <defaultnormal_vertex>
  pos = position;
  vUv = uv;`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `varying vec3 vViewPosition;`,
      `varying vec3 vViewPosition;
  varying vec3 pos;
  varying vec2 vUv;
  uniform float time;

  vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy ) {
  vec3 vSigmaX = dFdx( surf_pos );
  vec3 vSigmaY = dFdy( surf_pos );
  vec3 vN = surf_norm;    // normalized
  vec3 R1 = cross( vSigmaY, vN );
  vec3 R2 = cross( vN, vSigmaX );
  float fDet = dot( vSigmaX, R1 );
  vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
  return normalize( abs( fDet ) * surf_norm - vGrad );
}

#define M_PI 3.1415926535897932384626433832795

// adapted from https://www.shadertoy.com/view/Msl3RX

int numRows = 180;
int numCols = 20;

#define period (.5)
#define halfperiod (period * 0.5)
#define fdt (mod(time, period))
#define fdth (mod(time, halfperiod))

#define moveFlip (int(mod(time, period * 2.0) > period))
#define moveRows (int(mod(time, period) > halfperiod))
#define moveEvens (int(mod(time, period) > halfperiod))

float pattern( vec2 uv ){

  vec2 res = vec2(.5);

  int move_evens = moveEvens;
  if (moveFlip > 0)
  {
    move_evens = 1 - moveEvens;
  }

  float dx = res.x / float(numRows);
  float dy = res.y / float(numCols);

  float x = uv.x;
  float y = uv.y;

  x *= res.x/res.y;

  int rowx = int(x / dx);
  int rowy = int(y / dy);

  int xeven = int(mod(float(rowx), 2.0));
  int yeven = int(mod(float(rowy), 2.0));

  float t = fdth / halfperiod;

  float dtx = dx * t * 2.0;
  float dty = dy * t * 2.0;

  if (moveEvens == 1)
  {
    if (moveRows == 1 && xeven == 1)
    {
      y = y + dty;
      rowy = int(y / dy);
    }
    else if (moveRows == 0 && yeven == 0)
    {
      x = x + dtx;
      rowx = int(x / dx);
    }
  }
  else
  {
    if (moveRows == 1 && xeven == 0)
    {
      y = y + dty;
      rowy = int(y / dy);
    }
    else if (moveRows == 0 && yeven == 1)
    {
      x = x + dtx;
      rowx = int(x / dx);
    }
  }

  xeven = int(mod(float(rowx), 2.0));
  yeven = int(mod(float(rowy), 2.0));

  if (xeven == yeven) {
    return 0.;
  } else {
    float cx = float(rowx) + .5;
    float cy = float(rowy) + .5;
    float d = 1.-length(vec2(x/dx-cx,y/dy-cy));
    d = smoothstep(.45,.55,clamp(d,0.,1.));
    return d;
  }
}

`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );

  float e = .001;
  vec2 uv = vUv+4.*vec2(time/float(numRows), time/float(numCols));
  float hr = pattern(uv + vec2(-e,0.));
  float hg = pattern(uv);
  float hb = pattern(uv + vec2(e,0.));
  float stripOffset = hg - pattern(uv+vec2(0.,.00005));
  float modifiedRoughness = hg;
  diffuseColor.rgb = vec3(1.-hr, 1.-hg, 1.-hb);`);

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = modifiedRoughness;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment>',
      `#include <normal_fragment>
      normal = perturbNormalArb( -vViewPosition, normal, vec2( 0., stripOffset ) );`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

  }
  return material;
}

const mesh = new THREE.Mesh(
  new THREE.TorusKnotBufferGeometry(3,1,200,200),
  getMaterial()
);
mesh.receiveShadow = mesh.castShadow = true;
group.add(mesh);

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

camera.position.set(0,0,20);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 1.5;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;
  const t = time / loopDuration;

  if (mesh.material.uniforms) {
    mesh.material.uniforms.time.value = t;
  }
  mesh.rotation.x = .025 * Maf.TAU * Math.sin(t*Maf.TAU);
  mesh.rotation.z = .025 * Maf.TAU * Math.cos(t*Maf.TAU);

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
