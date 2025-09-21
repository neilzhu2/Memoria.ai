import React from 'react';
import { X } from 'lucide-react';
import img202506201048141 from "figma:asset/b35cbda7cebfe30e1ef1d5be76ce86960a1c70b8.png";

function EditMemoryContent({ prompt }: { prompt: string }) {
  return (
    <div className="relative shrink-0 w-full" data-name="Edit Memory Content">
      <div className="flex flex-row items-center relative size-full">
        <div className="box-border content-stretch flex flex-row gap-6 items-center justify-start pl-6 pr-16 py-0 relative w-full">
          <div
            className="basis-0 font-['Shantell_Sans:Bold',_sans-serif] font-bold grow leading-[0] min-h-px min-w-px relative shrink-0 text-[24px] text-[rgba(0,0,0,0.8)] text-center tracking-[-0.48px]"
            style={{ fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0" }}
          >
            <p className="block leading-[normal]">{prompt}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditMemoryHeader({ prompt, onCloseClick }: { prompt: string; onCloseClick: () => void }) {
  return (
    <div
      className="box-border content-stretch flex flex-col gap-4 items-center justify-start p-0 relative shrink-0 w-full"
      data-name="Edit Memory Header"
    >
      <div
        className="bg-center bg-cover bg-no-repeat h-[7px] shrink-0 w-[45px]"
        data-name="截屏2025-06-20 上午10.48.14 1"
        style={{ backgroundImage: `url('${img202506201048141}')` }}
      />
      <div className="relative w-full">
        <EditMemoryContent prompt={prompt} />
        <button
          onClick={onCloseClick}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close recording"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>
    </div>
  );
}