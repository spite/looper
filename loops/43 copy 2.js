import THREE from '../third_party/three.js';
import {renderer, getCamera} from '../modules/three.js';
import {Curves} from '../third_party/THREE.CurveExtras.js';
import Maf from '../modules/maf.js';
import easings from '../modules/easings.js';

const canvas = renderer.domElement;
const camera = getCamera();
camera.fov = 120;
camera.zoom = 7;
camera.updateProjectionMatrix();
const scene = new THREE.Scene();
const group = new THREE.Group();

function getMaterial() {
  const material = new THREE.MeshStandardMaterial({ metalness: .05, roughness: .5});
  material.onBeforeCompile = async (shader) =>{
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
#define TAU 2.*M_PI

//#define seed 17.
#define seed 23.13123
// a variant from jt's https://www.shadertoy.com/view/4st3R7
// beside code golfing, main difference is s + S

float hash( float n ) { return fract(sin(n)*753.5453123); }
float noise( in vec3 x )
{
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);

  float n = p.x + p.y*157.0 + 113.0*p.z;
  return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                 mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
  mix(mix( hash(n+113.0), hash(n+114.0),f.x),
      mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}
#define mirror(v) abs(2. * fract(v / 2.) - 1.)

float rnd(vec2 co){
    return fract(sin(dot(co.xy + seed,vec2(12.9898,78.233))) * 43758.5453);
    //return noise( vec3( s, seed ) );
    //texture2D(iChannel0, seed + seed*0.001).x;
}

float len(vec2 v)
{
    float w = 1.25/(.25+mirror(seed*.125));
    return pow(dot(pow(v, vec2(w)), vec2(1)), 1./w);
}

float flip(vec2 v, float w)
{
    v = fract(v / 2.) - .5;
    return mix(w, 1. - w, step(0., v.x * v.y));
}

float tile(vec2 v)
{
    v = fract(v);
    return smoothstep(.0,.05, abs(len(v)-.5)) * smoothstep(.0,.05, abs(len(1.-v)-.5));
}

float tile_full(vec2 v)
{
    v = fract(v);
    return smoothstep(.45,.55, len(v)) * smoothstep(.45,.55, len(1.-v));
}

float pattern(vec2 v)
{
    vec2 id = floor(v);
    float res = mix(
        flip(v, rnd(id / 128.) < .5 ? 1.-tile_full(v) : tile_full(vec2(1.-v.x,v.y))),
        1.-(rnd(id / 128.) < .5 ? tile(v) : tile(vec2(1.-v.x,v.y))),
        mirror(seed*.01));
    return .25+1.*clamp(.5-res,0.,1.);
}

float pp(vec2 v, vec2 offset) {
  vec2 uv = mod(vec2(10.,5.) * mod(vUv + vec2(opacity,opacity),vec2(1.)),vec2(1.));
  vec2 uv2 = mod(vec2(20.,10.) * mod(vUv + vec2(opacity,opacity),vec2(1.)),vec2(1.));
  return 2.*smoothstep(.145,1.,pattern(uv+offset) * pattern(uv2+offset))+.2;
}
`);

   shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( diffuse, opacity );
  vec2 uv = vUv + vec2(0.,10.*vUv.x);
  float p = pp(uv, vec2(0.));
  float e = .01;
  vec2 pOffset = vec2( pp(uv,vec2(0.,e))-p, pp(uv,vec2(e,0.))-p);
  float modifiedRoughness = clamp(smoothstep(0.,1.,p),0.,1.);
  diffuseColor.rgb = vec3(p);`);

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
      roughnessFactor = modifiedRoughness;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment>',
      `#include <normal_fragment>
      normal = perturbNormalArb( -vViewPosition, normal, pOffset );`
    );

    shader.fragmentShader = `#extension GL_OES_standard_derivatives : enable
    ${shader.fragmentShader}`;

  }
  return material;
}

const mesh = new THREE.Mesh(
  new THREE.TorusBufferGeometry(3,1.5,36,200),
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

camera.position.set(10,-15,10);
camera.lookAt(group.position);
renderer.setClearColor(0xffffff,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const loopDuration = 2.5;
const cameraOffset = new THREE.Vector3();

function draw(startTime) {

  const time = ( .001 * (performance.now()-startTime)) % loopDuration;

  mesh.material.opacity = -(time / loopDuration );
  mesh.rotation.y = Math.PI/4 + Math.sin(time*Maf.TAU/loopDuration) * Math.PI/8;
  mesh.rotation.x = Math.PI/8 + Math.sin(time*Maf.TAU/loopDuration) * Math.PI/16;

  renderer.render(scene, camera);
}

export { draw, loopDuration, canvas };
