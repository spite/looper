const turbulence = `
float turbulence( vec3 p ) {

  float w = 100.0;
  float t = -.5;

  for (float f = 1.0 ; f <= 10.0 ; f++ ){
    float power = pow( 2.0, f );
    t += abs( noise3d( vec3( power * p )));
  }

  return t;

}
`;

export default turbulence;
