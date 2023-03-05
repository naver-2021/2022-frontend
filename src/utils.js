import * as d3 from 'd3';

export function scaleData(data, canvasSize) {
	const xExtent = d3.extent(data, d => d[0]);
	const yExtent = d3.extent(data, d => d[1]);
	const xScale = d3.scaleLinear().domain(xExtent).range([0, canvasSize]);
	const yScale = d3.scaleLinear().domain(yExtent).range([0, canvasSize]);
	const scaledData = data.map(d => [xScale(d[0]), yScale(d[1])]);

	return scaledData;
}