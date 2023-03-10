import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as FUNC from "./functionalities";
import * as utils from "./utils"

const url = 'http://gpu.hcil.snu.ac.kr:8888/'

const GroupView = (props) => {

	const filterOptions = FUNC.getFilterOptions();
	const [pointNum, setPointNum] = useState(0);
	const [groupInfo, setGroupInfo] = useState([]);

	const [isAddingGroup, setIsAddingGroup] = useState(false);
	const [newGroupName, setNewGroupName] = useState("");

	const [newGroupFilterDict, setNewGroupFilterDict] = useState(getNewGroupFilterDict());
	const [newGroupCoor, setNewGroupCoor] = useState([]);
	const [newGroupIdx, setNewGroupIdx] = useState(-1);

	useEffect(() => {
		props.onMountPointNum([pointNum, setPointNum]);
		props.onMountSetGroupInfo([groupInfo, setGroupInfo]);
	}, [groupInfo]);

	function runSplitQuery() { props.runQuery("split") }
	function runSeparateQuery() { props.runQuery("separate") }
	function runMergeQuery() { props.runQuery( "merge") }

	function getNewGroupFilterDict() {
		let newGroupFilterDict = {};
		for (let key of Object.keys(filterOptions)) { newGroupFilterDict[key] = new Set(); }
		return newGroupFilterDict;
	}

	function copyNewGroupFilterDict(newGroupFilterDict) {
		let copiedNewGroupFilterDict = {};
		for (let key of Object.keys(filterOptions)) { copiedNewGroupFilterDict[key] = new Set([...newGroupFilterDict[key]]); }
		return copiedNewGroupFilterDict;
	}

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


	function adjustFilter(e) {
		const filterOption = e.target.name;
		const filterValue = e.target.value;
		const checked = e.target.checked;
		if (checked) {
			const copiedNewGroupFilterDict = copyNewGroupFilterDict(newGroupFilterDict);
			copiedNewGroupFilterDict[filterOption] = new Set([
				...copiedNewGroupFilterDict[filterOption], filterValue
			]);
			setNewGroupFilterDict(copiedNewGroupFilterDict);
		}
		else {
			const copiedNewGroupFilterDict = copyNewGroupFilterDict(newGroupFilterDict);
			copiedNewGroupFilterDict[filterOption].delete(filterValue);
			setNewGroupFilterDict(copiedNewGroupFilterDict);
		}
		const filterParam = FUNC.getGroupFilterParam(newGroupFilterDict, filterOption, filterValue, checked);
		axios.post(url + 'filter',filterParam)
			.then((res) => {
				setNewGroupCoor(res.data);
				props.updateColorBasedOnGroupView(newGroupIdx, res.data)
			});
	}

	function addGroup(e) {
		setNewGroupFilterDict(getNewGroupFilterDict());
		const maxIdx = props.getGroupInfo().length
		setNewGroupName("Group_" + maxIdx);
		setIsAddingGroup(true);
		setNewGroupIdx(maxIdx);
		e.target.disabled = true;
	}

	function confirmGroup() {
		const newGroupCoorBoolean = utils.indicesToBooleanArray(newGroupCoor, pointNum);
		props.addGroupInfo({
			id: newGroupIdx, coors: newGroupCoorBoolean, name: newGroupName, 
			selected: false, shielded: false
		});
		setGroupInfo(props.getGroupInfo());

		document.getElementsByClassName("groupAddButton")[0].disabled = false;
		setIsAddingGroup(false);
		setNewGroupName("");
		setNewGroupIdx(-1);
		setNewGroupCoor([]);
		setNewGroupFilterDict(getNewGroupFilterDict());
		props.confirmNewGroupLabel()
	}

	function deleteGroup() {
		const selectedGroupId = groupInfo.filter((group) => group.selected).map((group) => group.id);
		selectedGroupId.forEach((id) => { props.deleteGroupInfo(id) });
		setGroupInfo(props.getGroupInfo());
		props.updateColor();
	}

	function mergeGroup() {
		const selectedGroupId = groupInfo.filter((group) => group.selected).map((group) => group.id);
		props.mergeGroupInfo(selectedGroupId);
		console.log(props.getGroupInfo());
		setGroupInfo(props.getGroupInfo());
		props.updateColor();

	}
	return (
		<div>
				<div>

				<h1>Group View</h1>
				<button className="groupAddButton" onClick={addGroup}>+ADD Group</button>
				<button className="groupDeleteButton" onClick={deleteGroup}>-DELETE Group</button>
				<button className="groupMergeButton" onClick={mergeGroup}>MERGE Group</button>

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