interface RightSidebarProps {
  volume: number;
  setVolume: (v: number) => void;
  soundType: string;
  setSoundType: (t: any) => void;
  onTestSound: () => void;
}

export function RightSidebar({
  volume,
  setVolume,
  soundType,
  setSoundType,
  onTestSound,
}: RightSidebarProps) {
  // Custom vertical slider component
  const VerticalSlider = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
  }) => (
    <div className="flex flex-col items-center h-48 group">
      <div className="relative flex-1 w-2 bg-gray-800 rounded-full mb-3">
        <div
          className="absolute bottom-0 w-full bg-yellow-500 rounded-full group-hover:bg-yellow-400 transition-colors"
          style={{ height: `${value * 100}%` }}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a20] border-2 border-yellow-500 rounded-full shadow-lg pointer-events-none transition-all group-hover:scale-110"
          style={{ bottom: `calc(${value * 100}% - 8px)` }}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium tracking-wide">
        {label}
      </span>
    </div>
  );

  const Knob = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center gap-2">
      <div className="w-10 h-10 rounded-full border-2 border-gray-700 flex items-center justify-center relative cursor-pointer hover:border-yellow-500/50 transition-colors">
        <div className="absolute w-1 h-3 bg-yellow-500 top-1 rounded-full origin-bottom transform rotate-45"></div>
      </div>
      <span className="text-[10px] text-gray-500 uppercase">{label}</span>
    </div>
  );

  return (
    <div className="bg-[#0f0f13] rounded-2xl p-5 border border-white/5 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Mixer & FX</h3>
        <div className="bg-[#1a1a20] rounded-lg p-3 border border-white/5 mb-6">
          <div className="text-xs text-gray-500 mb-1">INPUT</div>
          <div className="text-white font-mono">GL / Allwoofer</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <VerticalSlider label="Vol" value={volume} onChange={setVolume} />
        {/* Dummy sliders for visual match */}
        <VerticalSlider label="Pan" value={0.5} onChange={() => {}} />
        <VerticalSlider label="Share" value={0.7} onChange={() => {}} />
        <VerticalSlider label="Reverb" value={0.3} onChange={() => {}} />
      </div>

      <div className="grid grid-cols-5 gap-2 mb-8">
        {["Size", "Damp", "Width", "Level", "Mix"].map((label) => (
          <Knob key={label} label={label} />
        ))}
      </div>

      <div className="mt-auto space-y-3">
        {/* Instrument Selector (Functional) */}
        <select
          value={soundType}
          onChange={(e) => setSoundType(e.target.value)}
          className="w-full bg-[#1a1a20] text-gray-300 transform rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-yellow-500 focus:outline-none"
        >
          <option value="piano">Piano</option>
          <option value="electric-guitar">Guitar</option>
          <option value="sax">Sax</option>
          <option value="synth">Synth</option>
          <option value="hard-synth">Hard Synth</option>
          <option value="synth-bass">Bass</option>
        </select>

        <button
          onClick={onTestSound}
          className="w-full bg-yellow-500 text-black font-bold py-3 rounded-xl hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/20"
        >
          Apply Collaborate
        </button>
      </div>
    </div>
  );
}
