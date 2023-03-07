import { useEffect, useRef } from 'react';
import './App.css';
import * as SCATTER from './scatterplot';
import axios from 'axios';
import * as d3 from 'd3';
import robustPointInPolygon from "robust-point-in-polygon";
import GroupView from './GroupView';

/* LIST of Constants */
const URL      = 'http://gpu.hcil.snu.ac.kr:8888/'
const COLORMAP = d3.schemeCategory10;
const INITIALCOLOR = 0xaaaaaa;
const SIZE     = 700;

const ATTRLENGTH   = 8;
const INITIALWEIGHT = new Array(ATTRLENGTH).fill(0.5); 

function App() {
	
	let scatterplotObj;

	/* list of variables to be mangaged by a component */
	const weights  = JSON.parse(JSON.stringify(INITIALWEIGHT));
	let currWeight = JSON.parse(JSON.stringify(INITIALWEIGHT));
	
	let labels, prevLabels;

	// variables for managing groups for views (including group view)
	let setGroupInfo = null;
	let groupInfo = null;
	let pointNum = null;
	let setPointNum = null;
	
	// functions to communicate with a child component
	const onMountSetGroupInfo = (dataFromChild) => { groupInfo = dataFromChild[0]; setGroupInfo = dataFromChild[1]; }
	const onMountPointNum = (dataFromChild) => { pointNum = dataFromChild[0]; setPointNum = dataFromChild[1]; }
	
	function updateWeightSlider(weights) { weights.forEach((weight, idx) => { document.getElementById("slider_" + idx).value = weight * 50; }); }
	function updateGroupState(newGroupInfo) { setGroupInfo([...newGroupInfo]); }
	function getGroupInfo() { return scatterplotObj.getGroupInfo(); }
	function addGroupInfo(newGroupInfo)  { scatterplotObj.addGroupInfo(newGroupInfo); }
	function confirmNewGroupLabel() { scatterplotObj.synchronizeLabel(); }

	// initial function called when the page is loaded
	useEffect(() => {
		if (scatterplotObj !== undefined) return;
		scatterplotObj = new SCATTER.scatterplot(
			document.getElementById("canvas"), document.getElementById("lassoSvg"), 
			updateWeightSlider, updateGroupState, INITIALWEIGHT, URL, SIZE, COLORMAP
		);
		(async () => { await scatterplotObj.initialLDRendering(INITIALCOLOR) })();
		(async () => {
			const attrList = await scatterplotObj.getAttributeList();
			attrList.forEach((attr, i) => { document.getElementById("attrName_" + i).innerHTML = attr; });
		})();
	});

	function updateLDBasedOnSlider(e) {
		const idx = e.target.getAttribute('idx');
		const value = e.target.value / 50;
		currWeight.forEach((d, idx) => { weights[idx] = d; });
		weights[idx] = value;
		(async () => { 
			await scatterplotObj.updateLDToTargetWeight(weights, weights, 750);
			currWeight = JSON.parse(JSON.stringify(weights));
		 })();
	}

	function updateColorBasedOnGroupView(label, indices) {
		scatterplotObj.updateLabelTemp(label, indices)
		scatterplotObj.updateColor();
	}

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
					// await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
					// TODO
				})();
			}
			else {
				(async () => {
					const response = await axios.post(URL + "query_merge", { params: { index: indexListString } });
					const newWeight = response.data.weights;
					// await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
					// TODO
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
				// await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
				// TODO
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
				// await updateLDToTargetWeight(currWeight, newWeight, 10, 750, true);
				// TODO
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
				<GroupView 
					onMountSetGroupInfo={onMountSetGroupInfo} 
					onMountPointNum={onMountPointNum}
					runQuery={runQuery}
					updateColorBasedOnGroupView={updateColorBasedOnGroupView}
					confirmNewGroupLabel={confirmNewGroupLabel}
					pointNum={pointNum}
					addGroupInfo={addGroupInfo}
					getGroupInfo={getGroupInfo}
				/>
				
			</div>
    </div>
  );
}

export default App;
