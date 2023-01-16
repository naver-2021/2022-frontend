import { useEffect } from 'react';
import * as Three from "three";
import './App.css';
import * as pr from './pointRendering';
import axios from 'axios';
import * as d3 from 'd3';


const url = 'http://gpu.hcil.snu.ac.kr:8888/'

function App() {
	
	function generateRandomPoints(width) {
		// generate 2D data with range 0~width
		const data = [];
		for (let i = 0; i < 100; i++) {
			data.push({
				x: Math.random() * width,
				y: Math.random() * width,
			});
		}
		return data;
	}

	// define a function that sends query to the backend. The URL is http://gpu.hcil.snu.ac.kr:8888/
	// query is a empty string for now.
	// the function is a async function, so you can use await to wait for the response.
	// use axios instead of fetch 


	async function sendWeightAndReceiveLds(weight) {
		const weightString = weight.join(',')
		const response = await axios.get(url + "weights_to_pr", { params: {weights: weightString}})
		return response.data;
	}



	useEffect(() => {
		const initialWeights = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

		const canvas = document.getElementById("canvas");
		const renderer = new Three.WebGLRenderer({ canvas : canvas });
		const camera = new Three.OrthographicCamera(
			0, canvas.width, canvas.height, 0, 0, 1
		);
		camera.position.set(0, 0, 1);
		const scene  = new Three.Scene();
		scene.background = new Three.Color(0xffffff);
		(async () => {
			const data = await sendWeightAndReceiveLds(initialWeights);
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
			const meshes = scaledData.map((d) => pr.generateMesh(d, 5, 0xaaaaaa));
			meshes.forEach((mesh) => scene.add(mesh));
			console.log(meshes)
			renderer.render(scene, camera);
		})();

		

	})

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
					{new Array(8).fill(0).map((_, i) => {
						return (
							<div className="slider" key={i}>
								<input
									type="range"
									min="0"
									max="100"
									defaultValue="50"
									className="slider"
									id="myRange"
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
