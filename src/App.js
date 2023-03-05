import { useEffect, useRef } from 'react';
import * as Three from "three";
import './App.css';
import * as SCATTER from './scatterplot';
import axios from 'axios';
import * as d3 from 'd3';
import robustPointInPolygon from "robust-point-in-polygon";
import GroupView from './GroupView';
import * as utils from "./utils";
import * as FUNC from './functionalities';
import * as ANIME from './animate';

/* LIST of Constants */
const URL      = 'http://gpu.hcil.snu.ac.kr:8888/'
const COLORMAP = d3.schemeCategory10;
const INITIALCOLOR = 0xaaaaaa;
const SIZE     = 700;

const ATTRLENGTH   = 8;
const INITIALWEIGHT = new Array(ATTRLENGTH).fill(0.5); 



function App() {
	
	// object that manges the rendering
  let scatterplotObj, animationObj;

	/* list of variables to be mangaged by a component */
	const weights  = JSON.parse(JSON.stringify(INITIALWEIGHT));
	let currWeight = JSON.parse(JSON.stringify(INITIALWEIGHT));
	
	let coors;
	let labels, prevLabels;


	// initial function called when the page is loaded
	useEffect(() => {
		if (scatterplotObj !== undefined) return;
		scatterplotObj = new SCATTER.scatterplot(document.getElementById("canvas"), document.getElementById("lassoSvg"), SIZE);
		animationObj = new ANIME.Animate(scatterplotObj);
		(async () => { await initialLDRendering(weights); })();
		(async () => {
			const attrList = await FUNC.getAttrList(URL);
			attrList.forEach((attr, i) => { document.getElementById("attrName_" + i).innerHTML = attr; });
		})();
	});

	

	async function initialLDRendering(weight) {
		if (scatterplotObj.checkRendered()) { return; }
		coors = await FUNC.getLDfromWeight(weight, URL, SIZE);

		labels = new Array(coors.length).fill(-1);
		prevLabels = new Array(coors.length).fill(-1);
		setPointNum(coors.length);
		scatterplotObj.addMeshes(coors, INITIALCOLOR);
		function render() {
			const currWeight = animationObj.executeAnimation();
			if (currWeight !== null) {
				currWeight.forEach((d, idx) => { document.getElementById("slider_" + idx).value = d * 50; })
			}
			scatterplotObj.render();
			requestAnimationFrame(render);
		}
		render();
	}


	async function updateLDToTargetWeight(initialWeight, targetWeight, time, isTargetCoor) {
		
		let targetCoor;	
		if (isTargetCoor === false) {
			targetCoor = await FUNC.getLDfromWeight(targetWeight, URL, SIZE);
			animationObj.registerAnimation(coors, targetCoor, initialWeight, targetWeight, time);
		}
		else {
			targetCoor = await FUNC.getLDfromWeight(targetWeight, URL, SIZE);
			animationObj.registerAnimation(coors, targetCoor, initialWeight, targetWeight, time);
		}
		coors = JSON.parse(JSON.stringify(targetCoor));
		currWeight = JSON.parse(JSON.stringify(targetWeight));
		
	}

	function updateLDBasedOnSlider(e) {
		const idx = e.target.getAttribute('idx');
		const value = e.target.value / 50;
		currWeight.forEach((d, idx) => { weights[idx] = d; });
		weights[idx] = value;
		(async () => { await updateLDToTargetWeight(currWeight, weights, 750, false); })();
	}



	// variables for lassoing groups
	let lassos = {};
	let isLassoing = false;
	let startPosition;

	const groups = {};
	let currGroupNum = -1;
	let lassoPaths;

	let groupInfo = null;
	let setGroupInfo = null;

	let pointNum = null;
	let setPointNum = null;

	const onGroupViewMount = (dataFromChild) => {
		groupInfo = dataFromChild[0];
		setGroupInfo = dataFromChild[1];
	}
	const onMountPointNum  = (dataFromChild) => {
		pointNum = dataFromChild[0];
		setPointNum = dataFromChild[1];
	}

	function updateColor() {
		labels.forEach((label, idx) => {
			if (label === -1) { 
				scatterplotObj.setMeshColor(idx, 0xaaaaaa);
				scatterplotObj.setMeshPosition(idx, [scatterplotObj.getMeshPosition(idx)[0], scatterplotObj.getMeshPosition(idx)[1], 0]);
			}
			else {
				scatterplotObj.setMeshColor(idx, COLORMAP[label % 10]);
				scatterplotObj.setMeshPosition(idx, [scatterplotObj.getMeshPosition(idx)[0], scatterplotObj.getMeshPosition(idx)[1], 0.0000000000001 * label]);
				scatterplotObj.setMeshScale(idx, [1, 1, 1]);
			}
		})
		groupInfo.forEach((group, i) => {
			if (group.selected) {
				group.coors.forEach((coor, idx) => {
					if (coor) {
						scatterplotObj.setMeshScale(idx, [1.5, 1.5, 1.5]);
					}
				});
			}
		});
	}

	function tempUpdateLabel(newGroupIdx, coors) {
		const newLabels = JSON.parse(JSON.stringify(prevLabels));
		coors.forEach((idx) => {
			newLabels[idx] = newGroupIdx;
		});
		labels = newLabels;
	}

	function updateColorBasedOnGroupView(newGroupIdx, coors) {
		tempUpdateLabel(newGroupIdx, coors);
		updateColor();
	}

	function confirmNewGroupLabel() {
		prevLabels = JSON.parse(JSON.stringify(labels));
	}


	// lasso setting
	useEffect(() => {
		function clickLasso(e) {
			if (!isLassoing) {
				isLassoing = true;
				currGroupNum = groupInfo.length;
				groups[currGroupNum] = new Array(coors.length).fill(false);
				startPosition = [e.offsetX, e.offsetY];
				lassoPaths = [[startPosition[0], startPosition[1]]];
				prevLabels = JSON.parse(JSON.stringify(labels));
				d3.select(e.target)
					.append("circle")
					.attr("id", "currentLassoCircle")
					.attr("cx", startPosition[0])
					.attr("cy", startPosition[1])
					.attr("r", 5)
					.attr("fill", "None")
					.attr("stroke", COLORMAP[currGroupNum % 10])

				d3.select(e.target)
				  .append("path")
					.attr("id", "currentLassoPath")
					.attr("fill", "None")
					.attr("stroke", COLORMAP[currGroupNum % 10])
					.attr("stroke-dasharray", "5,5");
			}
			else if (isLassoing) {
				isLassoing = false;
				d3.select(e.target)
					.select("#currentLassoCircle")
					.remove();
				
				d3.select(e.target)
					.select("#currentLassoPath")
					.remove();
				
				setGroupInfo([...groupInfo, {
					idx: currGroupNum, coors: groups[currGroupNum],
					selected: false, shielded: false
				}]);
				
			}
		}

		function mouseMoveLasso(e) {
			if (isLassoing) {
				const currPosition = [e.offsetX, e.offsetY];
				const prevPosition = lassoPaths[lassoPaths.length - 1];
				const distance = Math.sqrt((currPosition[0] - prevPosition[0]) ** 2 + (currPosition[1] - prevPosition[1]) ** 2);
				if (distance > 8) {
					lassoPaths.push(currPosition);

					// draw lasso path
					const polygon = [...lassoPaths, startPosition]
					d3.select(e.target)
						.select("#currentLassoPath")
						.attr("d", d3.line()(polygon))

					coors.forEach((xy, i) => {
						if (robustPointInPolygon(lassoPaths, [xy[0], SIZE - xy[1]]) === -1) {
							groups[currGroupNum][i] = true;
							labels[i] = currGroupNum;
						}
						else {
							groups[currGroupNum][i] = false;
							labels[i] = prevLabels[i];
						}
					});
					console.log(labels)
					updateColor();
				}
			}
		}

		d3.select("#lassoSvg")
			.on("click", clickLasso)
			.on("mousemove", mouseMoveLasso)
	})

	function runQuery(groupInfo, queryType) {
		// TODO
		if (queryType == "merge") {
			const selectedAndShieldedGroups = groupInfo.filter((group) => group.selected);
			const shieldedGroups = selectedAndShieldedGroups.filter((group) => group.shielded);
			const selectedGroups = selectedAndShieldedGroups.filter((group) => !group.shielded);
			if (selectedAndShieldedGroups.length < 1) {
				alert("Please select at least one group");
				return;
			}
			const selectedCoors = new Array(selectedGroups[0].coors.length).fill(false);
			selectedGroups.forEach((group) => {
				group.coors.forEach((coor, i) => {
					selectedCoors[i] = selectedCoors[i] || coor;
				})
			});
			const indexList = selectedCoors.map((coor, i) => i).filter((i) => selectedCoors[i]);
			const indexListString = indexList.join(",");

			if (shieldedGroups.length > 0) {
				let shieldIndexList = []
				shieldedGroups.forEach((group) => {
					const groupIndexList = group.coors.map((coor, i) => i).filter((i) => group.coors[i]);
					shieldIndexList = shieldIndexList.concat(groupIndexList);
				});
				const shieldIndexListString = JSON.stringify(shieldIndexList);
				(async () => {
					console.log(shieldIndexList, indexList)
					const response = await axios.post(URL + "query_merge_cluster", { params: { merge: indexListString, indices: shieldIndexListString } });
					const newWeight = response.data.weights;
					await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
				})();
			}
			else {
				(async () => {
					const response = await axios.post(URL + "query_merge", { params: { index: indexListString } });
					const newWeight = response.data.weights;
					await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
				})();
			}
	
		}
		if (queryType == "separate") {
			const selectedGroups = groupInfo.filter((group) => group.selected);
			if (selectedGroups.length < 2) {
				alert("Please select at least two groups");
				return;
			}
			const indexList = []
			selectedGroups.forEach((group) => {
				const groupIndexList = group.coors.map((coor, i) => i).filter((i) => group.coors[i]);
				indexList.push(groupIndexList);
			});
			console.log(indexList.length)
			const indexListString = JSON.stringify(indexList);
			(async () => {
				const response = await axios.post(URL + "query_cluster", { params: { indices: indexListString } });
				const newWeight = response.data.weights;
				await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
			})();
		}
		if (queryType == "split") {
			const selectedGroups = groupInfo.filter((group) => group.selected);
			if (selectedGroups.length > 1) {
				alert("Please select only one group");
				return;
			}
			let indexList = [];
			selectedGroups.forEach((group) => {
				const groupIndexList = group.coors.map((coor, i) => i).filter((i) => group.coors[i]);
				indexList = indexList.concat(groupIndexList);
			});
			(async () => {
				const response = await axios.post(URL + "query_split", { params: { index: indexList } });
				const newWeight = response.data.weights;
				await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
			})();

		}
	}



  return (
    <div className="App">
			<div className="AppWrapper">
				<div>
					<canvas
						width={SIZE}
						height={SIZE}
						id="canvas"
						style={{ border: '1px solid black', position: 'absolute' }}
					></canvas>
					<svg
						id="lassoSvg"
						width={SIZE}
						height={SIZE}
						style={{ position: 'absolute', border: '1px solid black' }}
					></svg>
				</div>
				<div className="sliderDiv" style = {{ marginLeft: 700}}>
					<h1>Slider</h1>
					{new Array(ATTRLENGTH).fill(0).map((_, i) => {
						return (
							<div className="slider" key={i}>
								<div id={"attrName_" + i}>
								</div>
								<input
									type="range"
									min="0"
									max="50"
									defaultValue="25"
									className="slider"
									id={"slider_" + i}
									onMouseUp={updateLDBasedOnSlider}
									idx={i}
								></input>
							</div>
						);
					})}
				</div>
				<GroupView onMount={onGroupViewMount} 
					onMountPointNum={onMountPointNum}
				runQuery={runQuery}
					updateColorBasedOnGroupView={updateColorBasedOnGroupView}
					updateColor={updateColor}
					confirmNewGroupLabel={confirmNewGroupLabel}
					pointNum={pointNum}
				/>
				
			</div>
    </div>
  );
}

export default App;
