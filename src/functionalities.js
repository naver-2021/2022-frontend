import axios from 'axios';
import * as utils from "./utils"

export async function getLDfromWeight(weight, url, size) {
	const weightStr = weight.join(",")
	const response = await axios.post(url + "weights_to_pr", { params : { weights: weightStr }})
	return utils.scaleData(response.data, size)
}

