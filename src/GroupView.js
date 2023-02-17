import React, { useEffect, useState } from 'react';


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

	useEffect(() => {
		props.onMount([groupInfo, setGroupInfo]);
	}, [groupInfo]);

	function onClickSelectBox(e) {
		const groupIdx = e.target.className.split("_")[1];
		const checked = e.target.checked;
		groupInfo[groupIdx].selected = checked;
	}

	function onClickShieldBox(e) {
		const groupIdx = e.target.className.split("_")[1];
		const checked = e.target.checked;
		groupInfo[groupIdx].shielded = checked;
	}

	function runSplitQuery() { props.runQuery(groupInfo, "split")}

	function runSeparateQuery() { props.runQuery(groupInfo, "separate")}

	function runMergeQuery() { props.runQuery(groupInfo, "merge") }

	function addGroup() {
		// get max group info index
		const maxIdx = groupInfo.reduce((max, group) => {
			return max > group.idx ? max : group.idx;
		}, 0);
		setNewGroupName("Group_" + maxIdx);
		setIsAddingGroup(true);
	}

	function adjustFilter(e) {
		console.log(e)
		console.log(e.target)
		console.log("ADJSUT")
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
		console.log(filterOption, filterValue, checked, newGroupFilterDict[filterOption][0])

	}

	function confirmGroup() {

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