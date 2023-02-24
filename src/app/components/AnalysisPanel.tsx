import React from "react";

export function CardEntry({
  attributes,
}: {
  attributes: { name: string; selected: boolean; change?: "up" | "down" }[];
}) {
  return (
    <div>
      <div className="flex">
        {attributes.map(({ name, selected, change }) => (
          <p className={selected ? "bg-green-500" : ""}>
            {name}
            {change === "up" && <span>⬆</span>}
            {change === "down" && <span>⬇</span>}
          </p>
        ))}
      </div>
      <div className="w-11/12 h-[150px] bg-gray-100 m-1 border rounded">
        asd
      </div>
    </div>
  );
}

export function AnalysisPanel() {
  return (
    <div>
      <CardEntry attributes={[{ name: "지역", selected: true }]} />
      <CardEntry
        attributes={[
          { name: "지역", selected: true },
          { name: "성별", selected: false, change: "up" },
        ]}
      />
    </div>
  );
}
