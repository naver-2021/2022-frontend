import * as Three from 'three';
import * as d3 from 'd3';

export function generateMesh(data, radius, color) {
	const geometry = new Three.CircleGeometry(radius, 32);
	const material = new Three.MeshBasicMaterial({ color: color })
	const mesh     = new Three.Mesh(geometry, material);
	mesh.position.set(data.x, data.y, 0);
	mesh.scale.set(1, 1, 1);
	// mesh.material.transparent = true;
	// mesh.material.opacity = 0.5;

	return mesh;
}