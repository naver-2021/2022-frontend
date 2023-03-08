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

export async function getMergeShieldQueryWeights(url, mergeList, shieldList) {
	const mergeListStr = mergeList.join(",")
	const shieldListStr = shieldList.join(",")
	const response = await axios.post(url + "query_merge_cluster", { params: { merge: mergeListStr, indices: shieldListStr } });
	return response.data.weights;
}

export async function getMergeQueryWeights(url, mergeList) {
	const mergeListStr = mergeList.join(",")
	const response = await axios.post(url + "query_merge", { params: { index: mergeListStr } });
	return response.data.weights;
}

export async function getSeparateQueryWeights(url, separateList) {
	const separateListStr = separateList.join(",");
	const response = await axios.post(url + "query_separate", { params: { index: separateListStr } });
	return response.data.weights;
}

export async function getSplitQueryWeights(url, splitList) {
	const splitListStr = splitList.join(",");
	const response = await axios.post(url + "query_split", { params: { index: splitListStr } });
	return response.data.weights;
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

export function getGroupFilterParam(newGroupFilterDict, filterOption, filterValue, checked) {
	const beforeDict = {
		"gender": [...newGroupFilterDict["Gender"]],
		"age": [...newGroupFilterDict["Age"]],
		"addr": [...newGroupFilterDict["Loc"]]
	};
	if (checked) {
			if (filterOption == "Gender")
				beforeDict["gender"] = [...beforeDict["gender"], filterValue];
			else if (filterOption == "Age")
				beforeDict["age"] = [...beforeDict["age"], filterValue];
			else if (filterOption == "Loc")
				beforeDict["addr"] = [...beforeDict["addr"], filterValue];
		}
		else {
			if (filterOption == "Gender")
				beforeDict["gender"] = beforeDict["gender"].filter((value) => value !== filterValue);
			else if (filterOption == "Age")
				beforeDict["age"] = beforeDict["age"].filter((value) => value !== filterValue);
			else if (filterOption == "Loc")
				beforeDict["addr"] = beforeDict["addr"].filter((value) => value !== filterValue);
		}
	if (beforeDict["gender"].length === 0) delete beforeDict["gender"];
	if (beforeDict["age"].length === 0)    delete beforeDict["age"];
	if (beforeDict["addr"].length === 0)   delete beforeDict["addr"];

	return beforeDict;
}