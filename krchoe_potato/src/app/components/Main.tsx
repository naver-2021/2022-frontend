import React from "react";
import { AnalysisHeaderPanel } from "./AnalysisHeaderPanel";
import { AnalysisPanel } from "./AnalysisPanel";
import { GroupPanel } from "./GroupPanel";
import { ProjectionPanel } from "./ProjectionPanel";
import { QueryPanel } from "./QueryPanel";
import { WeightPanel } from "./WeightPanel";

export function Main() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 필요시 상위 컴포넌트로 이동 */}
      <nav className="bg-gradient-to-r from-[#03CF5D] to-[#06BEB8]">
        <div className="max-w-[90rem] mx-auto py-4 px-4 sm:px-6 md:px-8 text-white">
          <div className="flex items-center gap-5">
            <div className="h-4">NAVER</div>
            <b>Shopping Explorer</b>
          </div>
        </div>
      </nav>
      <div className="flex w-[1280px] h-[720px]">
        <div className="w-[270px]">
          <div className="h-[580px]">
            <GroupPanel />
          </div>
          <div className="h-[140px]">
            <QueryPanel />
          </div>
        </div>
        <div className="bg-gray-100 w-[670px]">
          <div className="h-[580px]">
            <ProjectionPanel />
          </div>
          <div className="h-[140px]">
            <WeightPanel />
          </div>
        </div>
        <div className="bg-red-50 w-[340px]">
          <div className="h-[140px]">
            <AnalysisHeaderPanel />
          </div>
          <div className="h-[580px]">
            <AnalysisPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
