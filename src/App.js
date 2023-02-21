import { useEffect, useRef } from 'react';
import * as Three from "three";
import './App.css';
import * as pr from './pointRendering';
import axios from 'axios';
import * as d3 from 'd3';
import robustPointInPolygon from "robust-point-in-polygon";
import GroupView from './GroupView';


const url = 'http://gpu.hcil.snu.ac.kr:8888/'

function App() {
	

	// define a function that sends query to the backend. The URL is http://gpu.hcil.snu.ac.kr:8888/
	// query is a empty string for now.
	// the function is a async function, so you can use await to wait for the response.
	// use axios instead of fetch 
	const attrLen = 8;
	const weights = new Array(attrLen).fill(0.5);

	const colorMap = d3.schemeCategory10;
	const size = 700;
	// for (let i = 0; i < attrLen; i++) {
		
	// 	sliderRefArr.push(useRef(null));
	// }
	

	// variables for rendering

	let currWeight = JSON.parse(JSON.stringify(weights));
	let canvas, renderer, camera, scene, meshes;
	const animation = [];
	let coors;
	let labels, prevLabels;
	

	async function initialLDRendering(weight) {
		if (meshes !== undefined) {
			return;
		}
		const weightString = weight.join(',')
		const response = await axios.post(url + "weights_to_pr", { params: {weights: weightString}})
		const data = response.data;
		const xExtent = d3.extent(data, (d) => d[0]);
		const yExtent = d3.extent(data, (d) => d[1]);
		const xScale = d3.scaleLinear().domain(xExtent).range([0, canvas.width]);
		const yScale = d3.scaleLinear().domain(yExtent).range([0, canvas.height]);
		const scaledData = data.map((d) => {
			return {
				x: xScale(d[0]),
				y: yScale(d[1]),
			}
		});
		coors = scaledData;
		labels = new Array(scaledData.length).fill(-1);
		prevLabels = new Array(scaledData.length).fill(-1);

		meshes = scaledData.map((d) => pr.generateMesh(d, 2, 0xaaaaaa));
		meshes.forEach((mesh) => scene.add(mesh));
		function render() {
			if (animation.length > 0) {
				const currTime = Date.now();
				const currAnimation = animation[0];
				if (currAnimation.startTime === undefined) {
					currAnimation.startTime = currTime;
				}
				const timeDiff = currTime - currAnimation.startTime;
				if (timeDiff > currAnimation.time) {
					animation.shift();
				}
				else {
					const timeRatio = timeDiff / currAnimation.time;
					const currWeight = currAnimation.startWeight.map((d, idx) => {
						return d + (currAnimation.endWeight[idx] - d) * timeRatio;
					});
					currWeight.forEach((d, idx) => {
						const slider = document.getElementById("slider_" + idx);
						slider.value = d * 50;
					});
					const currCoor = currAnimation.startCoor.map((d, idx) => {
						return {
							x: d.x + (currAnimation.endCoor[idx].x - d.x) * timeRatio,
							y: d.y + (currAnimation.endCoor[idx].y - d.y) * timeRatio,
						}
					});
					meshes.forEach((mesh, idx) => mesh.position.set(currCoor[idx].x, currCoor[idx].y, 0));
				}
			}
			renderer.render(scene, camera);
			requestAnimationFrame(render);
		}
		render();


	}

	async function getLD(weight) {
		const weightString = weight.join(',')
		const response = await axios.post(url + "weights_to_pr", { params: { weights: weightString } });
		const data = response.data;
		const xExtent = d3.extent(data, (d) => d[0]);
		const yExtent = d3.extent(data, (d) => d[1]);
		const xScale = d3.scaleLinear().domain(xExtent).range([0, canvas.width]);
		const yScale = d3.scaleLinear().domain(yExtent).range([0, canvas.height]);
		const scaledData = data.map((d) => {
			return {
				x: xScale(d[0]),
				y: yScale(d[1]),
			}
		});

		return scaledData;

	}

	async function updateLDToTargetWeight(initialWeight, targetWeight, step, time, isTargetCoor) {
		
		let targetCoor;	
		// console.log(targetCoor)
		if (isTargetCoor === false) {
			targetCoor = await getLD(targetWeight);
			registerAnimation(coors, targetCoor, targetWeight, targetWeight, time);
		}
		else {
			targetCoor = await getLD(targetWeight);
			registerAnimation(coors, targetCoor, initialWeight, targetWeight, time);
		}

		coors = JSON.parse(JSON.stringify(targetCoor));
		currWeight = JSON.parse(JSON.stringify(targetWeight));
		
		
		// registerAnimation(coors,)
	}

	function registerAnimation(startCoor, endCoor, startWeight, endWeight, time) {
		animation.push({
			startCoor: startCoor,
			endCoor: endCoor,
			startWeight: startWeight, 
			endWeight: endWeight,
			time: time,
		})
	}

	function sliderChange(e) {
		const idx = e.target.getAttribute('idx');
		const value = e.target.value / 50;
		currWeight.forEach((d, idx) => { weights[idx] = d; });
		weights[idx] = value;
		(async () => {
			await updateLDToTargetWeight(currWeight, weights, 10, 750, false);

		})();
	}





	useEffect(() => {
		if (canvas !== undefined) {
			return;
		}
		canvas = document.getElementById("canvas");

		renderer = new Three.WebGLRenderer({ canvas : canvas });
		camera = new Three.OrthographicCamera(
			0, canvas.width, canvas.height, 0, 0, 1
		);
		camera.position.set(0, 0, 1);
		scene  = new Three.Scene();
		scene.background = new Three.Color(0xffffff);


		(async () => {
			await initialLDRendering(weights);
		})();
	});


	// variables for lassoing groups
	let lassos = {};
	let isLassoing = false;
	let startPosition;

	const groups = {};
	let currGroupNum = -1;
	let lassoPaths;

	let groupInfo = null;
	let setGroupInfo = null;

	const onGroupViewMount = (dataFromChild) => {
		groupInfo = dataFromChild[0];
		setGroupInfo = dataFromChild[1];
	}

	function updateColor() {
		meshes.forEach((mesh, idx) => {
			if (labels[idx] === -1) {
				mesh.material.color.set(0xaaaaaa);
				// set render order to 0
				mesh.position.z = 0;
			}
			else {
				mesh.material.color.set(colorMap[labels[idx] % 10]);
				mesh.position.z = 0.0000000000001 * labels[idx];
			}
		});
	}

	function tempUpdateLabel(newGroupIdx, coors) {
		const newLabels = JSON.parse(JSON.stringify(prevLabels));
		console.log(coors, newGroupIdx)
		coors.forEach((idx) => {
			newLabels[idx] = newGroupIdx;
		});
		labels = newLabels;
		console.log(labels);
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
				currGroupNum += 1;
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
					.attr("stroke", colorMap[currGroupNum % 10])

				d3.select(e.target)
				  .append("path")
					.attr("id", "currentLassoPath")
					.attr("fill", "None")
					.attr("stroke", colorMap[currGroupNum % 10])
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

					// console.log(polygon, coors[300])
					coors.forEach((xy, i) => {
						// console.log(lassoPaths, xy)

						if (robustPointInPolygon(lassoPaths, [xy.x, size - xy.y]) === -1) {
							groups[currGroupNum][i] = true;
							labels[i] = currGroupNum;
						}
						else {
							groups[currGroupNum][i] = false;
							labels[i] = prevLabels[i];
						}
					});
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
			const selectedGroups = groupInfo.filter((group) => group.selected);
			const shieldedGroups = groupInfo.filter((group) => group.shielded);
			if (selectedGroups.length < 1) {
				alert("Please select at least one group");
				return;
			}
			const selectedCoors = new Array(selectedGroups[0].coors.length).fill(false);
			selectedGroups.forEach((group) => {
				group.coors.forEach((coor, i) => {
					selectedCoors[i] = selectedCoors[i] || coor;
				})
			});
			console.log(selectedCoors);
			const indexList = selectedCoors.map((coor, i) => i).filter((i) => selectedCoors[i]);
			console.log(indexList);
			const indexListString = indexList.join(",");

			if (shieldedGroups.length > 0) {
				const shieldIndexList = []
				shieldedGroups.forEach((group) => {
					const groupIndexList = group.coors.map((coor, i) => i).filter((i) => group.coors[i]);
					shieldIndexList.push(groupIndexList);
				});
				const shieldIndexListString = JSON.stringify(shieldIndexList);
				(async () => {
					const response = await axios.post(url + "query_merge_cluster", { params: { merge: indexListString, indices: shieldIndexListString } });
					const newWeight = response.data.weights;
					await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
				})();
			}
			else {
				(async () => {
					const response = await axios.post(url + "query_merge", { params: { index: indexListString } });
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
			const indexListString = JSON.stringify(indexList);
			(async () => {
				const response = await axios.post(url + "query_cluster", { params: { indices: indexListString } });
				const newWeight = response.data.weights;
				await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
			})();
		}
	}

	useEffect(() => {
		axios.get(url + "get_attr_list")
			.then((response) => {
				response.data.forEach((attr, i) => {
					document.getElementById("attrName_" + i).innerHTML = attr;
				})
			});
	});



  return (
    <div className="App">
			<div className="AppWrapper">
				<div>
					<canvas
						width={size}
						height={size}
						id="canvas"
						style={{ border: '1px solid black', position: 'absolute' }}
					></canvas>
					<svg
						id="lassoSvg"
						width={size}
						height={size}
						style={{ position: 'absolute', border: '1px solid black' }}
					></svg>
				</div>
				<div className="sliderDiv" style = {{ marginLeft: 700}}>
					<h1>Slider</h1>
					{new Array(attrLen).fill(0).map((_, i) => {
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
									// id="slider"
									id={"slider_" + i}
									onMouseUp={sliderChange}
									idx={i}
									// ref={sliderRefArr[i]}
								></input>
							</div>
						);
					})}
				</div>
				<GroupView onMount={onGroupViewMount} runQuery={runQuery}
					updateColorBasedOnGroupView={updateColorBasedOnGroupView}
					confirmNewGroupLabel={confirmNewGroupLabel}
				/>
				
			</div>
    </div>
  );
}

export default App;
