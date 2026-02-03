import React from 'react';
import { Trash2, Check, Play, Pause, RotateCcw } from 'lucide-react';

function RoundButton() {
  return (
    <div
      className="bg-[rgba(0,0,0,0.05)] relative rounded-[10.67px] shrink-0 size-[48px]"
      data-name="Round Button"
    >
      <div
        className="absolute inset-[-1.389%] rounded-[10.67px]"
        data-name="Pause Button Background"
      >
        <div
          aria-hidden="true"
          className="absolute border-[#444444] border-[2px] border-solid inset-[-2px] pointer-events-none rounded-[12.67px]"
        />
      </div>
    </div>
  );
}

function PauseBtn({ onPause }: { onPause: () => void }) {
  return (
    <button
      onClick={onPause}
      className="bg-[#ffffff] box-border content-stretch flex flex-row gap-[4px] items-center justify-start p-[4px] relative rounded-[12px] shrink-0 hover:bg-gray-50 active:scale-95 transition-all duration-200"
      data-name="Pause Btn"
    >
      <RoundButton />
    </button>
  );
}

export function PauseButton({ onPause }: { onPause: () => void }) {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2.5 items-center justify-center p-[10px] relative shrink-0 h-[88px]"
      data-name="Pause Button"
    >
      <PauseBtn onPause={onPause} />
    </div>
  );
}

export function ContinueRecordingButton({ onResume }: { onResume: () => void }) {
  return (
    <div
      className="box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[10px] relative shrink-0"
      data-name="Continue Recording Button"
    >
      <div
        className="bg-[#ffffff] box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[8px] rounded-[64px]"
        data-name="Frame"
      >
        <button
          onClick={onResume}
          className="bg-[rgba(0,0,0,0.05)] relative rounded-[360px] shrink-0 size-[72px] hover:bg-[rgba(0,0,0,0.1)] active:scale-95 transition-all duration-200"
          data-name="Round Button"
        >
          {/* Play Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Play size={20} className="text-[rgba(0,0,0,0.8)] ml-0.5" />
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
        </button>
      </div>
    </div>
  );
}

export function ReplayControlsContainer({ 
  onSaveMemory, 
  onReRecord, 
  onCloseClick, 
  isPlaying, 
  onPlayPause, 
  playbackPosition,
  totalDuration 
}: { 
  onSaveMemory: () => void;
  onReRecord: () => void;
  onCloseClick: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  playbackPosition: number;
  totalDuration: number;
}) {
  return (
    <div className="relative shrink-0 w-full" data-name="Replay Controls Container">
      {/* Progress Bar */}
      <div className="px-6 pb-4">
        <div className="relative w-full h-2 bg-gray-200 rounded-full">
          <div 
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${(playbackPosition / totalDuration) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls Row */}
      <div className="h-[88px] flex items-center justify-center">
        <div className="flex flex-row items-center relative w-full">
          <div className="box-border content-stretch flex flex-row gap-6 items-center justify-start px-6 py-0 relative w-full">
            {/* Delete Tab */}
            <div className="basis-0 grow h-10 min-h-px min-w-px relative shrink-0" data-name="tab1">
              <button
                onClick={onCloseClick}
                className="absolute overflow-clip size-6 translate-x-[-50%] translate-y-[-50%] hover:bg-gray-100 rounded-full p-1 transition-colors active:scale-95"
                style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.25px)" }}
              >
                <Trash2 size={16} className="text-[#141A1E]" />
              </button>
              <div
                className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] text-[11px] text-[rgba(0,0,0,0.5)] text-center text-nowrap translate-x-[-50%]"
                style={{
                  fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
                  top: "calc(50% + 7px)",
                  left: "calc(50% + 0.25px)",
                }}
              >
                <p className="block leading-[1.35] whitespace-pre">Delete</p>
              </div>
            </div>

            {/* Play/Pause and Re-record Button */}
            <div className="box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[10px] relative shrink-0">
              <div className="bg-[#ffffff] box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-[8px] rounded-[64px]">
                {/* Play/Pause Button */}
                <button
                  onClick={onPlayPause}
                  className="bg-[rgba(0,0,0,0.05)] relative rounded-[360px] shrink-0 size-[72px] hover:bg-[rgba(0,0,0,0.1)] active:scale-95 transition-all duration-200 mr-2"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isPlaying ? (
                      <Pause size={24} className="text-[rgba(0,0,0,0.8)]" />
                    ) : (
                      <Play size={24} className="text-[rgba(0,0,0,0.8)] ml-1" />
                    )}
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
                </button>

                {/* Re-record Button */}
                <button
                  onClick={onReRecord}
                  className="bg-[rgba(0,0,0,0.05)] relative rounded-[360px] shrink-0 size-[72px] hover:bg-[rgba(0,0,0,0.1)] active:scale-95 transition-all duration-200"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RotateCcw size={20} className="text-[rgba(0,0,0,0.8)]" />
                  </div>
                  <div
                    className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] text-[9px] text-[rgba(0,0,0,0.8)] text-center translate-x-[-50%]"
                    style={{
                      top: "calc(50% + 18px)",
                      left: "calc(50%)",
                      fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
                    }}
                  >
                    <p className="block leading-[1.35] whitespace-pre">Re-record</p>
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
                </button>
              </div>
            </div>

            {/* Save Tab */}
            <div className="basis-0 grow h-10 min-h-px min-w-px relative shrink-0" data-name="tab2">
              <button
                onClick={onSaveMemory}
                className="absolute overflow-clip size-6 translate-x-[-50%] translate-y-[-50%] hover:bg-gray-100 rounded-full p-1 transition-colors active:scale-95"
                style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.25px)" }}
              >
                <Check size={16} className="text-[#141A1E]" />
              </button>
              <div
                className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] text-[11px] text-[rgba(0,0,0,0.5)] text-center text-nowrap translate-x-[-50%]"
                style={{
                  fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
                  top: "calc(50% + 7px)",
                  left: "calc(50% + 0.25px)",
                }}
              >
                <p className="block leading-[1.35] whitespace-pre">Save</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PausedControlsContainer({ onResume, onStop, onCloseClick }: { 
  onResume: () => void;
  onStop: () => void;
  onCloseClick: () => void;
}) {
  return (
    <div className="relative shrink-0 w-full h-[88px] flex items-center justify-center" data-name="Save Button Container">
      <div className="flex flex-row items-center relative w-full">
        <div className="box-border content-stretch flex flex-row gap-6 items-center justify-start px-6 py-0 relative w-full">
          {/* Delete Tab */}
          <div className="basis-0 grow h-10 min-h-px min-w-px relative shrink-0" data-name="tab1">
            <button
              onClick={onCloseClick}
              className="absolute overflow-clip size-6 translate-x-[-50%] translate-y-[-50%] hover:bg-gray-100 rounded-full p-1 transition-colors active:scale-95"
              style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.25px)" }}
            >
              <Trash2 size={16} className="text-[#141A1E]" />
            </button>
            <div
              className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] text-[11px] text-[rgba(0,0,0,0.5)] text-center text-nowrap translate-x-[-50%]"
              style={{
                fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
                top: "calc(50% + 7px)",
                left: "calc(50% + 0.25px)",
              }}
            >
              <p className="block leading-[1.35] whitespace-pre">Delete</p>
            </div>
          </div>

          {/* Continue Recording Button */}
          <ContinueRecordingButton onResume={onResume} />

          {/* Done Tab */}
          <div className="basis-0 grow h-10 min-h-px min-w-px relative shrink-0" data-name="tab2">
            <button
              onClick={onStop}
              className="absolute overflow-clip size-6 translate-x-[-50%] translate-y-[-50%] hover:bg-gray-100 rounded-full p-1 transition-colors active:scale-95"
              style={{ top: "calc(50% - 8px)", left: "calc(50% - 0.25px)" }}
            >
              <Check size={16} className="text-[#141A1E]" />
            </button>
            <div
              className="absolute font-['Shantell_Sans:Bold',_sans-serif] font-bold leading-[0] text-[11px] text-[rgba(0,0,0,0.5)] text-center text-nowrap translate-x-[-50%]"
              style={{
                fontVariationSettings: "'BNCE' 0, 'INFM' 0, 'SPAC' 0",
                top: "calc(50% + 7px)",
                left: "calc(50% + 0.25px)",
              }}
            >
              <p className="block leading-[1.35] whitespace-pre">Done</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}