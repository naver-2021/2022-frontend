import React from "react";

export function CheckboxEntry({
  name,
  change,
}: {
  name: string;
  change?: "up" | "down";
}) {
  return (
    <div>
      <input type="checkbox" />
      <label>
        {name}
        {change === "up" && <span>⬆</span>}
        {change === "down" && <span>⬇</span>}
      </label>
    </div>
  );
}

export function AnalysisHeaderPanel() {
  return (
    <div>
      <p>분석할 특징을 선택하세요.</p>
      <div className="flex flex-wrap">
        <CheckboxEntry name="나이" />
        <CheckboxEntry name="성별" change="up" />
        <CheckboxEntry name="지역" />
        <CheckboxEntry name="디바이스" />
        <CheckboxEntry name="월" />
        <CheckboxEntry name="요일" change="down" />
        <CheckboxEntry name="시간대" />
        <CheckboxEntry name="아이템" />
        <CheckboxEntry name="브렌드" />
        <CheckboxEntry name="카테고리" />
      </div>
    </div>
  );
}
