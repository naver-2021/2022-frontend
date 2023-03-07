import axios from 'axios';
import * as utils from "./utils"

export async function getLDfromWeight(weight, url, size) {
	const weightStr = weight.join(",")
	const response = await axios.post(url + "weights_to_pr", { params : { weights: weightStr }})
	return utils.scaleData(response.data, size)
}

export async function getAttrList(url) {
	const response = await axios.get(url + "get_attr_list");
	return response.data;
}

export function getFilterOptions() {
	return {
		"Gender": ["f", "m"],
		"Age": ['13-18', '19-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-'],
		"Loc": ['경기도', '경상남도', '인천광역시', '강원도', '충청북도', '전라북도', '전라남도', '서울특별시',
			'경상북도', '부산광역시', '충청남도', '대구광역시', '울산광역시', '제주특별자치도', '광주광역시',
			'대전광역시', '세종특별자치시']
	};
}