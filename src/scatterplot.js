import * as Three from 'three';
import * as d3 from 'd3';


export class scatterplot {
	constructor(canvas, size) {
		this.canvas   = canvas;
		this.renderer = new Three.WebGLRenderer({ canvas: this.canvas });
		this.camera   = new Three.OrthographicCamera(0, size, size, 0, 0, 1);
		this.scene    = new Three.Scene();

		this.camera.position.set(0, 0, 1);
		this.scene.background = new Three.Color(0xffffff);
	}

	render() {
		this.renderer.render(this.scene, this.camera);
	} 

	checkRendered() {
		return this.meshes !== undefined;
	}

	addMeshes(coors, initialColor) {
		this.meshes = coors.map((coor) => generateMesh(coor, 5, initialColor));
		this.meshes.forEach((mesh) => this.scene.add(mesh));
	}

	setMeshesPosition(coors) {
		this.meshes.forEach((mesh, idx) => mesh.position.set(coors[idx][0], coors[idx][1], 0));
	}

	setMeshPosition(idx, coor) {
		this.meshes[idx].position.set(coor[0], coor[1], 0);
	}

	getMeshesPosition() {
		return this.meshes.map((mesh) => [mesh.position.x, mesh.position.y, mesh.position.z]);
	}

	getMeshPosition(idx) {
		return [this.meshes[idx].position.x, this.meshes[idx].position.y, this.meshes[idx].position.z];
	}

	setMeshesColor(colors) {
		this.meshes.forEach((mesh, idx) => mesh.material.color.set(colors[idx]));
	}

	setMeshColor(idx, color) {
		this.meshes[idx].material.color.set(color);
	}

	setMeshesScale(scales) {
		this.meshes.forEach((mesh, idx) => mesh.scale.set(scales[idx][0], scales[idx][1], scales[idx][2]));
	}

	setMeshScale(idx, scale) {
		this.meshes[idx].scale.set(scale[0], scale[1], scale[2]);
	}

}



// Helpers

function generateMesh(data, radius, color) {
	const geometry = new Three.CircleGeometry(radius, 5);
	const material = new Three.MeshBasicMaterial({ color: color })
	const mesh     = new Three.Mesh(geometry, material);

	mesh.position.set(data[0], data[1], 0);
	mesh.scale.set(1, 1, 1);

	return mesh;
}

