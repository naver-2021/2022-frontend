import React, { useState } from "react";

export function GroupEntry({ name, root }: { name: string; root: boolean }) {
  const [hover, setHover] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <div>
      <div
        className={
          hover
            ? "flex justify-between border border-teal-500 border-3"
            : "flex justify-between"
        }
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div>
          <input className={root ? "" : "ml-5"} type="checkbox" />
          <label>{name}</label>
          {hover && <button className="border">펜</button>}
        </div>
        {!root && (
          <div>
            {hover && <button className="border">잠</button>}
            {hover && <button className="border">눈</button>}
            {
              <button className="border" onClick={() => setExpanded(!expanded)}>
                {expanded ? "접" : "펼"}
              </button>
            }
          </div>
        )}
      </div>
      {expanded && (
        <div>
          <div className="border rounded m-4">
            총 324개의 포인트 기능 및 디자인 미정 나이 50-54 (42%), 55-59 (58%)
            성별 남성 (100%) 지역 서울특별시 (78%), 세종광역시(11%) 외 1건
            디바이스 PC (75%), mobile (25%) 월 5월 (25%), 6월 (11%) 외 5건 요일
            월요일 (15%), 화요일 (11%), 외 2개 시간대 15-18 (11%), 19-22 (7%),
            외 6개
          </div>
        </div>
      )}
    </div>
  );
}

export function GroupPanel() {
  return (
    <div>
      <div className="flex justify-between">
        <p className="mr-5">그룹</p>
        <button className="bg-gray-100 p-1">그룹 합치기</button>
        <button className="border">그룹 추가하기</button>
      </div>
      <div>
        <GroupEntry name="모든 데이터포인트" root={true} />
        <GroupEntry name="그룹 1" root={false} />
        <GroupEntry name="그룹 2" root={false} />
        <GroupEntry name="그 외 데이터포인트" root={false} />
      </div>
    </div>
  );
}
