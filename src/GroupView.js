import React, { useEffect, useState } from 'react';


const GroupView = (props) => {

	const [groupInfo, setGroupInfo] = useState([]);

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

	return (
		<div>
				<div>

				<h1>Group View</h1>
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
		</div>
	)
}

export default GroupView;