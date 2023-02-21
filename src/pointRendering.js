import * as Three from 'three';
import * as d3 from 'd3';

export function generateMesh(data, radius, color) {
	const geometry = new Three.CircleGeometry(radius, 5);
	const material = new Three.MeshBasicMaterial({ color: color })


	const mesh     = new Three.Mesh(geometry, material);

	// const mesh = new Three.InstancedMesh(geometry, material, 1);
	mesh.position.set(data.x, data.y, 0);
	mesh.scale.set(1, 1, 1);

	return mesh;
}