import { useEffect } from 'react';
import * as Three from "three";
import './App.css';
import * as pr from './pointRendering';
import axios from 'axios';
import * as d3 from 'd3';


const url = 'http://gpu.hcil.snu.ac.kr:8888/'

function App() {
	

	// define a function that sends query to the backend. The URL is http://gpu.hcil.snu.ac.kr:8888/
	// query is a empty string for now.
	// the function is a async function, so you can use await to wait for the response.
	// use axios instead of fetch 
	const attrLen = 8;
	const weights = new Array(attrLen).fill(0.5);
	let currWeight = JSON.parse(JSON.stringify(weights));
	let canvas, renderer, camera, scene, meshes;

	const animation = [];

	

	async function initialLDRendering(weight) {
		if (meshes !== undefined) {
			return;
		}
		console.log("BB")
		const weightString = weight.join(',')
		const response = await axios.get(url + "weights_to_pr", { params: {weights: weightString}})
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

	async function updateLDRendering(weight) {

		const scaledData = await getLD(weight);
		meshes.forEach((mesh, idx) => mesh.position.set(scaledData[idx].x, scaledData[idx].y, 0));
	}

	async function getLD(weight) {
		const weightString = weight.join(',')
		const response = await axios.get(url + "weights_to_pr", { params: { weights: weightString } });
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

	async function updateLDToTargetWeight(initialWeight, targetWeight, step, time) {
		const weightDiff = targetWeight.map((d, idx) => d - initialWeight[idx]);
		const weightStep = weightDiff.map((d) => d / step);
		const coors = new Array(step + 1).fill(undefined);
		await (async () => {
			for (let i = 0; i < step + 1; i++) {
				const tempWeight = initialWeight.map((d, idx) => d + weightStep[idx] * i);
				coors[i] = getLD(tempWeight);
			}
		})();
		const coorsReturn = await Promise.all(coors);
		console.log(coorsReturn)
		const subTime = time / step;
		for (let i = 0; i < step-1; i++) {
			registerAnimation(coorsReturn[i], coorsReturn[i + 1], subTime);
		}


		currWeight = JSON.parse(JSON.stringify(targetWeight));

	}

	function registerAnimation(startCoor, endCoor, time) {
		animation.push({
			startCoor: startCoor,
			endCoor: endCoor,
			time: time,
		})
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

	function sliderChange(e) {
		const idx = e.target.getAttribute('idx');
		const value = e.target.value / 50;
		weights[idx] = value;
		(async () => {
			await updateLDToTargetWeight(currWeight, weights, 50, 750);
			
		})();
	}


  return (
    <div className="App">
			<div className="AppWrapper">
				<canvas
					width={700}
					height={700}
					id="canvas"
					style={{ border: '1px solid black' }}
				></canvas>
				<div className="sliderDiv">
					{new Array(attrLen).fill(0).map((_, i) => {
						return (
							<div className="slider" key={i}>
								<input
									type="range"
									min="0"
									max="50"
									defaultValue="25"
									className="slider"
									id="myRange"
									onMouseUp={sliderChange}
									idx={i}
								></input>
							</div>
						);
					})}
				</div>

			</div>
    </div>
  );
}

export default App;
