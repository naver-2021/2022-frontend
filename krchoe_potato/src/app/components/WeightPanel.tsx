import React from "react";

export function SliderEntry({
  name,
  change,
}: {
  name: string;
  change?: "up" | "down";
}) {
  return (
    <div className="p-3">
      <label className="block mb-1 text-sm font-medium text-gray-900 dark:text-white">
        {name}
        {change === "up" && <span>⬆</span>}
        {change === "down" && <span>⬇</span>}
      </label>
      <input
        type="range"
        value="50"
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      ></input>
    </div>
  );
}

export function WeightPanel() {
  return (
    <div>
      <div className="grid grid-cols-4">
        <SliderEntry name="나이" />
        <SliderEntry name="성별" change="up" />
        <SliderEntry name="지역" />
        <SliderEntry name="디바이스" />
        <SliderEntry name="월" />
        <SliderEntry name="요일" change="down" />
        <SliderEntry name="시간대" />
        <SliderEntry name="카운트" />
      </div>
      <div>pagination</div>
    </div>
  );
}
