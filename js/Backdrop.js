function Backdrop( lightPosition, top, bottom ) {

	this.backGeometry = new THREE.IcosahedronBufferGeometry(1,4);
	this.backMaterial = new THREE.RawShaderMaterial({
		uniforms: {
			top: { type: 'c', value: new THREE.Color(top) },
			bottom: { type: 'c', value: new THREE.Color(bottom) },
			lightPosition: { type: 'v3', value: lightPosition }
		},
		vertexShader: document.getElementById( 'backdrop-vs' ).textContent,
		fragmentShader: document.getElementById( 'backdrop-fs' ).textContent,
		side: THREE.BackSide,
		depthWrite: false
	});
	return new THREE.Mesh( this.backGeometry, this.backMaterial );

}
