import svgPaths from "./svg-y36c5aftwl";

function Icon() {
  return (
    <div
      className="absolute overflow-clip size-6 translate-x-[-50%] translate-y-[-50%]"
      data-name="Icon"
      style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.25px)" }}
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Memories Icon">
          <path
            d={svgPaths.p3c081180}
            fill="var(--fill-0, #141A1E)"
            id="<i class='fa-regular fa-list'></i>"
          />
        </g>
      </svg>
    </div>
  );
}

function Tab1() {
  return (
    <div
      className="basis-0 grow h-10 min-h-px min-w-px relative shrink-0"
      data-name="tab1"
    >
      <Icon />
      <div
        className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] text-[11px] text-[rgba(0,0,0,0.5)] text-center text-nowrap translate-x-[-50%]"
        style={{
          fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
          top: "calc(50% + 7px)",
          left: "calc(50% + 0.25px)",
        }}
      >
        <p className="block leading-[1.35] whitespace-pre">Memories</p>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <div
      className="absolute bottom-0 left-[-2.08%] right-[2.08%] top-0"
      data-name="Settings Icon"
    >
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
      >
        <g id="Settings Icon">
          <path
            d={svgPaths.pf4ca580}
            fill="var(--fill-0, #141A1E)"
            id="<i class='fa-regular fa-user'></i>"
          />
        </g>
      </svg>
    </div>
  );
}

function Icon1() {
  return (
    <div
      className="absolute overflow-clip size-6 translate-x-[-50%] translate-y-[-50%]"
      data-name="Icon"
      style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.25px)" }}
    >
      <SettingsIcon />
    </div>
  );
}

function Tab2() {
  return (
    <div
      className="basis-0 grow h-10 min-h-px min-w-px relative shrink-0"
      data-name="tab2"
    >
      <Icon1 />
      <div
        className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] text-[11px] text-[rgba(0,0,0,0.5)] text-center text-nowrap translate-x-[-50%]"
        style={{
          fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
          top: "calc(50% + 7px)",
          left: "calc(50% - 0.25px)",
        }}
      >
        <p className="block leading-[1.35] whitespace-pre">Settings</p>
      </div>
    </div>
  );
}

function RoundButton() {
  return (
    <div
      className="bg-[rgba(0,0,0,0.05)] relative rounded-[360px] shrink-0 size-[72px]"
      data-name="Round Button"
    >
      <div
        className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold h-12 leading-[0] text-[12px] text-[rgba(0,0,0,0.8)] text-center translate-x-[-50%] w-14"
        style={{
          top: "calc(50% - 24px)",
          left: "calc(50% + 1px)",
          fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
        }}
      >
        <p className="block leading-[1.35]">Start Recording</p>
      </div>
      <div
        className="absolute inset-[-4.86%_-4.86%_-3.47%_-3.47%] rounded-[360px]"
        data-name="Highlight Border"
      >
        <div
          aria-hidden="true"
          className="absolute border-[#444444] border-[3px] border-solid inset-[-3px] pointer-events-none rounded-[363px]"
        />
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div
      className="absolute bg-[#ffffff] box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[8px] rounded-[64px] top-[-30px] translate-x-[-50%]"
      data-name="Frame"
      style={{ left: "calc(50% - 0.5px)" }}
    >
      <RoundButton />
    </div>
  );
}

function Tabs() {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-[88px] items-start justify-start p-0 relative shrink-0 w-full"
      data-name="tabs"
    >
      <Tab1 />
      <Tab2 />
      <Frame />
    </div>
  );
}

function GestureIndicatorBar() {
  return (
    <div
      className="h-8 overflow-clip relative shrink-0 w-full"
      data-name="Gesture Indicator Bar"
    >
      <div
        className="absolute bg-[rgba(0,0,0,0.05)] bottom-2 h-1 rounded-[360px] translate-x-[-50%] w-[120px]"
        data-name="Rectangle"
        style={{ left: "calc(50% + 0.5px)" }}
      />
    </div>
  );
}

function BottomTabBarWithLabels() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col gap-1 items-center justify-end pb-0 pt-2 px-0 relative shadow-[0px_-2px_24px_0px_rgba(0,0,0,0.08)] shrink-0 w-full"
      data-name="Bottom Tab Bar with Labels"
    >
      <Tabs />
      <GestureIndicatorBar />
    </div>
  );
}

export default function BottomTabBarWithBigButton() {
  return (
    <div
      className="bg-[#ffffff] box-border content-stretch flex flex-col gap-1 items-center justify-end pb-0 pt-8 px-0 relative size-full"
      data-name="Bottom Tab Bar with big button"
    >
      <BottomTabBarWithLabels />
    </div>
  );
}