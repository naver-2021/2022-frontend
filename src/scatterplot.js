import * as Three from 'three';
import * as d3 from 'd3';
import * as ANIME from './animate';


import * as DATA from "./data";
import * as FUNC from "./functionalities";

export class scatterplot {
	constructor(
		canvas, lassoSvg, 
		onUpdateWeight, onUpdateGroup,
		initialWeight, url, size, colormap
	) {
		this.canvas   = canvas;
		this.lassoSvg = lassoSvg;
		this.colormap = colormap;
		this.url 		  = url;
		this.size     = size;

		this.onUpdateWeight = onUpdateWeight;
		this.onUpdateGroup = onUpdateGroup;

		this.renderer = new Three.WebGLRenderer({ canvas: this.canvas });
		this.camera   = new Three.OrthographicCamera(0, size, size, 0, 0, 1);
		this.scene    = new Three.Scene();

		this.camera.position.set(0, 0, 1);
		this.scene.background = new Three.Color(0xffffff);

		// ANIMATION and DATA
		this.animationObj = new ANIME.Animate();
		this.dataObj = new DATA.Data(initialWeight, url, size);

		// lassoing variables
		this.isLassoing     = false; 
		this.startPosition  = undefined;
		this.lassoPath      = undefined;
		this.nextGroup      = undefined;
		this.nextGroupId    = undefined;
		this.registerLassoEvent();

	}

	// functions for rendering and updating
	async initialLDRendering(initialColor) {
		if (this.checkRendered()) return;
		await this.dataObj.receiveInitialCoors();
		this.initialColor = initialColor;
		this.addMeshes(this.dataObj.getCoors(), initialColor);
		this.renderFrame();
	}

	async updateLDToTargetWeight(initialWeight, targetWeight, time) {
		const currentCoor = JSON.parse(JSON.stringify(this.dataObj.getCoors()));
		await this.dataObj.updateCoorsBasedOnWeight(targetWeight);
		const targetCoor  = this.dataObj.getCoors();
		this.animationObj.registerAnimation(currentCoor, targetCoor, initialWeight, targetWeight, time);
		this.dataObj.setCurrWeights(targetWeight);
	}

	renderFrame() {
		const currInfo = this.animationObj.executeAnimation();
		if (currInfo !== undefined) {
			this.dataObj.setCoors(currInfo.coors);
			this.dataObj.setCurrWeights(currInfo.weights);
			this.onUpdateWeight(currInfo.weights);
			this.meshes.forEach((mesh, idx) => mesh.position.set(currInfo.coors[idx][0], currInfo.coors[idx][1], 0));
		}
		this.render();
		window.webkitRequestAnimationFrame(this.renderFrame.bind(this));
	}

	// helper functions for rendering and updating
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

	// functions for attribute setting
	async getAttributeList() {
		return await FUNC.getAttrList(this.dataObj.url);
	}

	// functions for lasso selection
	registerLassoEvent() {
		// TODO
		this.lassoSvg.addEventListener("click", this.clickLassoSvg.bind(this));
		this.lassoSvg.addEventListener("mousemove", this.mouseMoveLassoSvg.bind(this));
			// .on("mousemove", mousemoveLassoSvg)
	}

	clickLassoSvg(e) {
		if (!this.isLassoing) {
			this.isLassoing = true;
			this.nextGroup = new Array(this.dataObj.getLen()).fill(false);
			this.startPosition = [e.offsetX, e.offsetY];
			this.lassoPath = [[e.offsetX, e.offsetY]];
			this.dataObj.setPrevLabelsAsLabels();
			const nextGroupId = this.dataObj.getNextGroupId();
			d3.select(this.lassoSvg)
			  .append("circle")
				.attr("id", "currentLassoCircle")
				.attr("cx", this.startPosition[0])
				.attr("cy", this.startPosition[1])
				.attr("r", 5)
				.attr("fill", "None")
				.attr("stroke", this.colormap[nextGroupId % 10]);
			
			d3.select(this.lassoSvg)
				.append("path")
				.attr("id", "currentLassoPath")
				.attr("fill", "None")
				.attr("stroke", this.colormap[nextGroupId % 10])
				.attr("stroke-dasharray", "5,5")
		}
		else {
			this.isLassoing = false;
			d3.select(this.lassoSvg).select("#currentLassoCircle").remove();
			d3.select(this.lassoSvg).select("#currentLassoPath").remove();

			this.dataObj.addGroupInfo({
				id: this.dataObj.getNextGroupId(),
				name: `Group ${this.dataObj.getNextGroupId()}}`,
				coors: this.nextGroup,
				selected: false, shielded: false
			});
			this.onUpdateGroup(this.dataObj.getGroupInfo());
		}
	}

	mouseMoveLassoSvg(e) {
		if (!this.isLassoing) return;
		const currPosition = [e.offsetX, e.offsetY];
		const prevPosition = this.lassoPath[this.lassoPath.length - 1];
		const distance = Math.sqrt((currPosition[0] - prevPosition[0]) ** 2 + (currPosition[1] - prevPosition[1]) ** 2);
		
		if (distance > (this.size / 100)) {
			this.lassoPath.push(currPosition);
			const polygon = [...this.lassoPath, this.startPosition];
			d3.select(this.lassoSvg).select("#currentLassoPath").attr("d", d3.line()(polygon));
			const pointsInPolygon = this.dataObj.getPointsInPolygon(polygon);
			pointsInPolygon.forEach((isInPolygon, idx) => {
				if (isInPolygon) {
					this.nextGroup[idx] = true;
					this.dataObj.setLabel(idx, this.dataObj.getNextGroupId());
				}
				else {
					this.nextGroup[idx] = false;
					this.dataObj.setLabel(idx, this.dataObj.getPrevLabel(idx));
				}
			});
		}

		this.updateColor();
	}

	// rendering color 
	updateColor() {
		const labels = this.dataObj.getLabels();
		labels.forEach((label, idx) => {
			if (label === -1) {
				this.setMeshColor(idx, 0xaaaaaa);
				this.setMeshPosition(idx, [this.getMeshPosition(idx)[0], this.getMeshPosition(idx)[1], 0]);
			}
			else {
				this.setMeshColor(idx, this.colormap[label % 10]);
				this.setMeshPosition(idx, [this.getMeshPosition(idx)[0], this.getMeshPosition(idx)[1], 0.0000000000001 * label]);
				this.setMeshScale(idx, [1, 1, 1]);
			}
		});
		const groupInfo = this.dataObj.getGroupInfo();
		groupInfo.forEach((group, i) => {
			if (group.selected) {
				group.coors.forEach((coor, idx) => {
					if (coor) {
						this.setMeshScale(idx, [1.5, 1.5, 1.5]);
					}
				});
			}
		});
	}

	// temporarilly update label
	updateLabelTemp(label, indices) {
		indices.forEach(idx => this.dataObj.setLabel(idx, label));
	}

	synchronizeLabel() {
		this.dataObj.setPrevLabelsAsLabels();
	}


	// functions for group management
	addGroupInfo(groupInfo) { this.dataObj.addGroupInfo(groupInfo); }
	getGroupInfo() { return this.dataObj.getGroupInfo(); }
	getLen() { return this.dataObj.getLen(); }

	// functions for query management
	async runQuery(queryType) {
		if      (queryType == "merge")     { return await this.runMergeQuery(); }
		else if (queryType == "separate") { return await this.runSeparateQuery() }
		else if (queryType == "split")     { return await this.runSplitQuery(); }
	}

	async runMergeQuery() {
		const groupInfo = this.dataObj.getGroupInfo();
		// Assume that selected groups contain shielded groups
		const shieldedGroups = groupInfo.filter(group => group.shielded);
		const selectedGroups = groupInfo.filter(group => group.selected && !group.shielded);
		if (selectedGroups.length < 1) { alert("Please select at least one group"); return; }

		const selectedIndexList = generateIndexListFromGroups(selectedGroups);
		const shieldedIndexList = generateIndexListFromGroups(shieldedGroups);
		let queryWeights;
		if (shieldedGroups.legnth > 0) queryWeights = await FUNC.getMergeShieldQueryWeights(this.url, selectedIndexList, shieldedIndexList);
		else queryWeights = await FUNC.getMergeQueryWeights(this.url, selectedIndexList);
		this.updateLDToTargetWeight(this.dataObj.getCurrWeights(), queryWeights, 750);
		return queryWeights;
	}
	

	async runSeparateQuery() {
		const groupInfo = this.dataObj.getGroupInfo();
		const selectedGroups = groupInfo.filter(group => group.selected);
		if (selectedGroups.length < 1) { alert("Please select at least one group"); return; }
		
		const selectedIndexList = generateIndexListFromGroups(selectedGroups);

		const queryWeights = await FUNC.getSeparateQueryWeights(this.url, selectedIndexList);
		this.updateLDToTargetWeight(this.dataObj.getCurrWeights(), queryWeights, 750);
		return queryWeights;

	}

	async runSplitQuery() {
		const selectedGroups = this.dataObj.getGroupInfo().filter(group => group.selected);
		if (selectedGroups.length < 1) { alert("Please select at least one group"); return; }

		const selectedIndexList = generateIndexListFromGroups(selectedGroups);

		const queryWeights = await FUNC.getSplitQueryWeights(this.url, selectedIndexList);
		this.updateLDToTargetWeight(this.dataObj.getCurrWeights(), queryWeights, 750);
		return queryWeights;
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

function generateIndexListFromGroups(groups) {
	const coors = new Array(groups.length).fill(false);
	groups.forEach(group => {
		group.coors.forEach((coor, idx) => {
			if (coor) coors[idx] = true;
		});
	});
	return coors.map((_, idx) => idx).filter((i) => coors[i]);
}

