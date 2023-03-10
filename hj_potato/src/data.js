import * as FUNC from './functionalities';
import robustPointInPolygon from "robust-point-in-polygon";
import * as d3 from 'd3';


export class Data {
	constructor(initialWeight, url, size) {
		this.initialWeight = initialWeight;
		this.currWeight = initialWeight;

		this.coors = undefined;
		this.len   = undefined;
		this.labels = undefined;
		this.prevLabels = undefined;

		this.url = url;
		this.size = size;

		// Info for Groups
		this.groupInfo = [];
		this.nextGroupId = 0;
	}

	async receiveInitialCoors() {
		this.coors  = await FUNC.getLDfromWeight(this.initialWeight, this.url, this.size);
		this.len    = this.coors.length;
		this.labels = new Array(this.len).fill(-1);
		this.prevLabels = new Array(this.len).fill(-1);
	}

	async updateCoorsBasedOnWeight(weight) {
		this.coors = await FUNC.getLDfromWeight(weight, this.url, this.size);
	}

	addGroupInfo(groupInfo) {
		this.groupInfo = [...this.groupInfo, groupInfo];
		this.nextGroupId += 1;
	}

	deleteGroupInfo(groupId) {
		this.groupInfo = this.groupInfo.filter(groupInfo => groupInfo.id !== groupId);
	}

	mergeGroupInfo(groupIdices) {
		const newGroupInfo = {
			id: undefined,
			coors: undefined,
			name: undefined,
			selected: false,
			shielded: false
		}
		newGroupInfo.id = d3.min(groupIdices);
		newGroupInfo.name = "Group_" + groupIdices.join("_");
		newGroupInfo.coors = new Array(this.len).fill(false);
		groupIdices.forEach((groupId) => {
			const groupInfo = this.groupInfo.find(groupInfo => groupInfo.id === groupId);
			groupInfo.coors.forEach((coor, idx) => {
				if (coor) newGroupInfo.coors[idx] = true;
			})
		});
		console.log(newGroupInfo.coors)
		this.groupInfo = this.groupInfo.filter(groupInfo => !groupIdices.includes(groupInfo.id));
		this.groupInfo = [...this.groupInfo, newGroupInfo];
	}

	getCoors() {
		return this.coors;
	}

	setCoors(coors) {
		this.coors = coors;
	}

	getLen() {
		return this.len;
	}

	setCurrWeights(currWeights) {
		this.currWeight = currWeights;
	}

	getCurrWeights() {
		return this.currWeight;
	}

	intiializeLabels() {
		this.labels = new Array(this.len).fill(-1);
	}

	setPrevLabelsAsLabels() {
		this.prevLabels = JSON.parse(JSON.stringify(this.labels));
	}

	getNextGroupId() {
		return this.nextGroupId;
	}

	getPointsInPolygon(polygon) {
		return this.coors.map((coor, idx) => {
			if (robustPointInPolygon(polygon, [coor[0], this.size - coor[1]]) === - 1) return true;
			else return false; 
		})
	}

	getLabels() { return this.labels; }

	setLabel(idx, label) { this.labels[idx] = label; }

	getPrevLabel(idx) { return this.prevLabels[idx]; }

	getGroupInfo() { return this.groupInfo; }

}