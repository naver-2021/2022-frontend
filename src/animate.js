
export class Animate {
	constructor(scatterplotObj) {
		this.animationList = [];
		this.scatterplotObj = scatterplotObj;
	}

	executeAnimation() {
		// return current weight to inform slider if the animation is executing

		if (this.animationList.length === 0) return;
		
		const currTime      = Date.now();
		const currAnimation = this.animationList[0];
		if (currAnimation.startTime === undefined) {
			currAnimation.startTime = currTime;
		}
		const timeDiff = currTime - currAnimation.startTime;
		if (timeDiff > currAnimation.duration) { this.animationList.shift(); return null; }
		else {
			const progress = timeDiff / currAnimation.duration;
			console.log(progress, timeDiff, currAnimation.duration)
			const currWeight = currAnimation.startWeight.map((weight, idx) => {
				return weight + (currAnimation.endWeight[idx] - weight) * progress;
			})
			const currCoor = currAnimation.startCorr.map((corr, idx) => {
				return [
					corr[0] + (currAnimation.endCorr[idx][0] - corr[0]) * progress,
					corr[1] + (currAnimation.endCorr[idx][1] - corr[1]) * progress,
				]
			});
			this.scatterplotObj.setMeshesPosition(currCoor);
			return currWeight;
		}
	}

	registerAnimation(startCoor, endCoor, startWeight, endWeight, duration) {
		this.animationList.push({
			startCorr: startCoor,
			endCorr: endCoor,
			startWeight: startWeight,
			endWeight: endWeight,
			duration: duration,
		});
	}
}