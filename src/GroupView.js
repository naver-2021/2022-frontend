import React, { useEffect, useState } from 'react';
import axios from 'axios';

const url = 'http://gpu.hcil.snu.ac.kr:8888/'

const GroupView = (props) => {

	const filterOptions = {
		"Gender": ["f", "m"],
		"Age": ['13-18', '19-24', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-'],
		"Loc": ['경기도', '경상남도', '인천광역시', '강원도', '충청북도', '전라북도', '전라남도', '서울특별시',
			'경상북도', '부산광역시', '충청남도', '대구광역시', '울산광역시', '제주특별자치도', '광주광역시',
			'대전광역시', '세종특별자치시']
	}

	const [groupInfo, setGroupInfo] = useState([]);
	const [isAddingGroup, setIsAddingGroup] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");
	const newGroupFilterDict = {
		"Gender": useState(new Set()),
		"Age": useState(new Set()),
		"Loc": useState(new Set())
	}
	const [newGroupCoor, setNewGroupCoor] = useState([]);
	const [newGroupIdx, setNewGroupIdx] = useState(-1);

	useEffect(() => {
		props.onMount([groupInfo, setGroupInfo]);
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
			"gender": [...newGroupFilterDict["Gender"][0]],
			"age": [...newGroupFilterDict["Age"][0]],
			"addr": [...newGroupFilterDict["Loc"][0]]
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
			newGroupFilterDict[filterOption][1](new Set([
				...newGroupFilterDict[filterOption][0], filterValue
			]));
		}
		else {
			newGroupFilterDict[filterOption][1](
				new Set(
					[...newGroupFilterDict[filterOption][0]].filter((value) => value !== filterValue)
				)
			)
		}

		const filterParam = getCurrentAxiosParamJson(filterOption, filterValue, checked);
		axios.post(url + 'filter',filterParam)
			.then((res) => {
				setNewGroupCoor(res.data);
				props.updateColorBasedOnGroupView(newGroupIdx, res.data)
			});
		

	}

	function confirmGroup() {
		setGroupInfo([
			...groupInfo, {
				idx: newGroupIdx, coors: newGroupCoor, name: newGroupName,
				selected: false, shielded: false
			}
		]);

		document.getElementsByClassName("groupAddButton")[0].disabled = false;
		setIsAddingGroup(false);
		setNewGroupName("");
		setNewGroupIdx(-1);
		setNewGroupCoor([]);
		newGroupFilterDict["Age"][1](new Set());
		newGroupFilterDict["Gender"][1](new Set());
		newGroupFilterDict["Loc"][1](new Set());

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
							// console.log({ filterOption })
							return (
								<div key={iIdx} style={{ display: "flex"}}>
									{filterOption}
									<div>
									{
										filterOptions[filterOption].map((option, jIdx) => {
											// console.log("aaa", option)
											return (
												<div key={jIdx}>
													<input 
														type="checkbox" name={filterOption} 
														value={option} onChange={e => adjustFilter(e)}
														checked={newGroupFilterDict[filterOption][0].has(option)}
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