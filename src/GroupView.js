import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as FUNC from "./functionalities";

const url = 'http://gpu.hcil.snu.ac.kr:8888/'

const GroupView = (props) => {

	const filterOptions = FUNC.getFilterOptions();
	const [pointNum, setPointNum] = useState(0);
	const [groupInfo, setGroupInfo] = useState([]);

	const [isAddingGroup, setIsAddingGroup] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");

	function getNewGroupFilterDict() {
		let newGroupFilterDict = {};
		// console.log(Object.keys(filterOptions))
		for (let key of Object.keys(filterOptions)) { newGroupFilterDict[key] = new Set(); }
		console.log(newGroupFilterDict)
		return newGroupFilterDict;
	}

	function copyNewGroupFilterDict(newGroupFilterDict) {
		let copiedNewGroupFilterDict = {};
		for (let key of Object.keys(filterOptions)) { copiedNewGroupFilterDict[key] = new Set([...newGroupFilterDict[key]]); }
		return copiedNewGroupFilterDict;
	}

	const [newGroupFilterDict, setNewGroupFilterDict] = useState(getNewGroupFilterDict());

	const [newGroupCoor, setNewGroupCoor] = useState([]);
	const [newGroupIdx, setNewGroupIdx] = useState(-1);

	useEffect(() => {
		props.onMountPointNum([pointNum, setPointNum]);
		props.onMountSetGroupInfo([groupInfo, setGroupInfo]);

		// for (let key in newGroupFilterDict) {
		// 	newGroupFilterDict[key][1](new Set());
		// }
	}, [groupInfo]);

	function onClickSelectBox(e) {
		const groupIdx = e.target.className.split("_")[1];
		const checked = e.target.checked;
		groupInfo[groupIdx].selected = checked;
		props.updateColor();
	}

	function onClickShieldBox(e) {
		const groupIdx = e.target.className.split("_")[1];
		const checked = e.target.checked;
		groupInfo[groupIdx].shielded = checked;
	}

	function runSplitQuery() { props.runQuery(groupInfo, "split")}

	function runSeparateQuery() { props.runQuery(groupInfo, "separate")}

	function runMergeQuery() { props.runQuery(groupInfo, "merge") }

	function addGroup(e) {
		// get max group info index
		setNewGroupFilterDict(getNewGroupFilterDict());
		console.log(newGroupFilterDict)

		console.log(groupInfo);
		const maxIdx = groupInfo.reduce((max, group) => {
			return max > group.idx ? max : group.idx;
		}, -1) + 1;
		setNewGroupName("Group_" + maxIdx);
		setIsAddingGroup(true);
		setNewGroupIdx(maxIdx);

		console.log(maxIdx);

		e.target.disabled = true;
	}

	function getCurrentAxiosParamJson(filterOption, filterValue, checked) {
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

		if (beforeDict["gender"].length === 0) {
			delete beforeDict["gender"];
		} 
		if (beforeDict["age"].length === 0) {
			delete beforeDict["age"];
		}
		if (beforeDict["addr"].length === 0) {
			delete beforeDict["addr"];
		}

		return beforeDict;
	}

	function adjustFilter(e) {

		const filterOption = e.target.name;
		const filterValue = e.target.value;
		const checked = e.target.checked;
		if (checked) {
			const copiedNewGroupFilterDict = copyNewGroupFilterDict(newGroupFilterDict);
			copiedNewGroupFilterDict[filterOption][1](new Set([
				...copiedNewGroupFilterDict[filterOption][0], filterValue
			]));
			setNewGroupFilterDict(copiedNewGroupFilterDict);
		}
		else {

		}
		// if (checked) {
		// 	newGroupFilterDict[filterOption][1](new Set([
		// 		...newGroupFilterDict[filterOption][0], filterValue
		// 	]));
		// }
		// else {
		// 	newGroupFilterDict[filterOption][1](
		// 		new Set(
		// 			[...newGroupFilterDict[filterOption][0]].filter((value) => value !== filterValue)
		// 		)
		// 	)
		// }

		const filterParam = getCurrentAxiosParamJson(filterOption, filterValue, checked);
		axios.post(url + 'filter',filterParam)
			.then((res) => {
				setNewGroupCoor(res.data);
				props.updateColorBasedOnGroupView(newGroupIdx, res.data)
			});
		

	}

	function confirmGroup() {
		const newGroupCoorBoolean = new Array(pointNum).fill(false);
		newGroupCoor.forEach((coor) => {
			newGroupCoorBoolean[coor] = true;
		});
		setGroupInfo([
			...groupInfo, {
				idx: newGroupIdx, coors: newGroupCoorBoolean, name: newGroupName,
				selected: false, shielded: false
			}
		]);

		document.getElementsByClassName("groupAddButton")[0].disabled = false;
		setIsAddingGroup(false);
		setNewGroupName("");
		setNewGroupIdx(-1);
		setNewGroupCoor([]);
		setNewGroupFilterDict(getNewGroupFilterDict());

		props.confirmNewGroupLabel()
	}
	return (
		<div>
				<div>

				<h1>Group View</h1>
				<button className="groupAddButton" onClick={addGroup}>+ADD Group</button>
				{groupInfo.map((group, idx) => {
					return (
						<div key={idx}>
							<button>
								{group.idx}
							</button>
							<label><input type="checkbox" className={"selectCheckBox_" + idx} name="select" onClick={onClickSelectBox}/> Select </label>
							<label><input type="checkbox" className={"shieldCheckBox_" + idx} name="shield" onClick={onClickShieldBox}/> Shield </label>
						</div>
					)
				})}

			</div>
			<div style={{ margin: 10}}>
				<button className="queryButton" onClick={runSplitQuery}>Split</button>
				<button className="queryButton" onClick={runSeparateQuery}>Separate</button>
				<button className="queryButton" onClick={runMergeQuery}>Merge</button>
			</div>
			{isAddingGroup ? <div>
				<div>
					<label>Group Name 
					<input type="text" className="groupNameInput" value={newGroupName} 
						onChange={(e) => setNewGroupName(e.target.value)}
					></input></label>
					{/* Make a radio button with two choices */}
						{Object.keys(filterOptions).map((filterOption, iIdx) => {
							return (
								<div key={iIdx} style={{ display: "flex"}}>
									{filterOption}
									<div>
									{
										filterOptions[filterOption].map((option, jIdx) => {
											return (
												<div key={jIdx}>
													<input 
														type="checkbox" name={filterOption} 
														value={option} onChange={e => adjustFilter(e)}
														checked={newGroupFilterDict[filterOption].has(option)}
													/>
													{option}
												</div>
											)
										})
									}
									</div>
								</div>		
							)
						})}
				</div>
				<div>
					<button className="groupConfirmButton" onClick={confirmGroup}>Confirm Group</button>
				</div>
			</div>:<></>}
		</div>
	)
}

export default GroupView;