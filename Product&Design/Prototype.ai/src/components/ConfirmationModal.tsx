import React from 'react';
import svgPaths from "../imports/svg-pt9oafvqya";

interface ConfirmationModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteMemoryLine() {
  return (
    <div
      className="relative shrink-0 size-[13.147px]"
      data-name="Delete Memory Line"
    >
      <div className="absolute inset-[-3.8%]">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 15 15"
        >
          <g id="Edit Memory Line">
            <path
              d="M14.1466 1.00023L1 14.1464"
              id="Line 2"
              stroke="var(--stroke-0, black)"
              strokeLinecap="round"
            />
            <path
              d={svgPaths.p1734a600}
              id="Line 3"
              stroke="var(--stroke-0, black)"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function DeleteMemoryContent() {
  return (
    <div className="relative shrink-0 w-full" data-name="Delete Memory Content">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-6 items-center justify-start px-6 py-0 relative w-full">
          <div
            className="basis-0 font-['Shantell_Sans:Bold',_sans-serif] font-bold grow leading-[0] min-h-px min-w-px relative shrink-0 text-[16px] text-[rgba(0,0,0,0.8)] text-center tracking-[-0.32px]"
            style={{ fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0" }}
          >
            <p className="block leading-[normal]">Delete this memory?</p>
          </div>
          <DeleteMemoryLine />
        </div>
      </div>
    </div>
  );
}

function DeleteMemoryHeader() {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-4 items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Delete Memory Header"
    >
      <DeleteMemoryContent />
    </div>
  );
}

function Tab1({ onCancel }: { onCancel: () => void }) {
  return (
    <div
      className="basis-0 grow min-h-px min-w-px relative shrink-0"
      data-name="tab1"
    >
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-[90px] py-0 relative w-full">
          <button
            onClick={onCancel}
            className="font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[11px] text-center text-nowrap hover:opacity-70 active:scale-95 transition-all duration-200"
            style={{ fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0" }}
          >
            <p className="block leading-[1.35] whitespace-pre">Cancel</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function Tab2({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div
      className="basis-0 grow min-h-px min-w-px relative shrink-0"
      data-name="tab2"
    >
      <div
        aria-hidden="true"
        className="absolute border border-[#000000] border-solid inset-0 pointer-events-none"
      />
      <div className="flex flex-row items-center justify-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-2.5 items-center justify-center px-[38px] py-4 relative w-full">
          <button
            onClick={onConfirm}
            className="font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] relative shrink-0 text-[#000000] text-[11px] text-center text-nowrap hover:opacity-70 active:scale-95 transition-all duration-200"
            style={{ fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0" }}
          >
            <p className="block leading-[1.35] whitespace-pre">Delete Memory</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteMemoryButtons({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-[65px] items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Delete Memory Buttons"
    >
      <Tab1 onCancel={onCancel} />
      <Tab2 onConfirm={onConfirm} />
    </div>
  );
}

function DeleteMemoryContainer({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      className="absolute bg-[#ffffff] box-border content-stretch flex flex-col gap-6 items-center justify-start left-[25px] p-[24px] rounded-3xl translate-y-[-50%] w-[343px]"
      data-name="Delete Memory Container"
      style={{ top: "calc(50% + 0.5px)" }}
    >
      <DeleteMemoryHeader />
      <div
        className="font-['Shantell_Sans:Regular',_sans-serif] font-normal leading-[normal] relative shrink-0 text-[15px] text-[rgba(0,0,0,0.8)] text-left tracking-[-0.3px] w-full"
        style={{ fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0" }}
      >
        <p className="block mb-0">
          This will permanently erase what you've recorded or written.
          <br aria-hidden="true" />{" "}
        </p>
        <p className="block">
          You won't be able to recover it. Are you sure you want to delete?
        </p>
      </div>
      <DeleteMemoryButtons onCancel={onCancel} onConfirm={onConfirm} />
    </div>
  );
}

export default function ConfirmationModal({ isVisible, onCancel, onConfirm }: ConfirmationModalProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] flex items-center justify-center"
      data-name="Confirmation Modal"
    >
      <DeleteMemoryContainer onCancel={onCancel} onConfirm={onConfirm} />
    </div>
  );
}