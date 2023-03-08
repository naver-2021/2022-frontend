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
	let weights  = JSON.parse(JSON.stringify(INITIALWEIGHT));
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
	function deleteGroupInfo(groupId) { scatterplotObj.deleteGroupInfo(groupId); scatterplotObj.updateLabelBasedOnGroupInfo(); }
	function mergeGroupInfo(groupIdices) { scatterplotObj.mergeGroupInfo(groupIdices); scatterplotObj.updateLabelBasedOnGroupInfo(); }
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
		scatterplotObj.updateLabelTemp(label, indices);
		scatterplotObj.updateColor();
	}

	function updateColor() { scatterplotObj.updateColor(); }
	async function runQuery(queryType) {
		const queryWeights = await scatterplotObj.runQuery(queryType);
		if (queryWeights === undefined) return;
		currWeight = JSON.parse(JSON.stringify(queryWeights));
		weights = JSON.parse(JSON.stringify(queryWeights));
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
					updateColor={updateColor}
					confirmNewGroupLabel={confirmNewGroupLabel}
					pointNum={pointNum}
					addGroupInfo={addGroupInfo}
					deleteGroupInfo={deleteGroupInfo}
					mergeGroupInfo={mergeGroupInfo}
					getGroupInfo={getGroupInfo}
				/>
				
			</div>
    </div>
  );
}

export default App;
