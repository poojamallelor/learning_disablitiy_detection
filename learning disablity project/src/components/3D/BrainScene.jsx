import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import BrainModel from './BrainModel';
import FloatingParticles from './FloatingParticles';
import NeuralConnections from './NeuralConnections';

const CameraController = ({ selectedPosition, isScanning }) => {
  useFrame((state) => {
    const { camera, size } = state;
    const aspect = size.width / size.height;
    
    // Scale Z based on aspect ratio to fit the model horizontally on mobile
    const defaultZ = aspect < 1.0 ? 4.2 / aspect * 0.85 : 4.2;
    // Keep Z bound within realistic ranges
    const zPos = Math.max(4.2, Math.min(6.5, defaultZ));

    if (selectedPosition) {
      // Interpolate camera to focus on the clicked region close-up
      const targetX = selectedPosition[0] * 1.6;
      const targetY = selectedPosition[1] * 1.6;
      const targetZ = selectedPosition[2] + (aspect < 1.0 ? 2.5 : 1.8);
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.08);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.08);
    } else if (isScanning) {
      // Move camera slightly during scanning for dynamic effect
      const t = state.clock.getElapsedTime();
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, Math.sin(t * 0.5) * 1.5, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, Math.cos(t * 0.5) * 0.5, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, aspect < 1.0 ? zPos * 0.9 : 3.8, 0.05);
    } else {
      // Return to default center position
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.06);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.06);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, zPos, 0.06);
    }
  });
  return null;
};

const regionDetails = {
  attention: {
    title: 'Attention Tracking',
    desc: 'Prefrontal Cortex: Evaluates concentration levels, spatial pattern response speed, and distraction indicators.',
    scoreLabel: 'Attention/Logic Consistency'
  },
  reading: {
    title: 'Reading Analysis',
    desc: 'Temporal Lobe: Processes auditory inputs, word-decoding, and speech-to-text pronunciation accuracy.',
    scoreLabel: 'Speech Phoneme Decoding'
  },
  writing: {
    title: 'Writing Assessment',
    desc: 'Motor Cortex & Frontal Lobe: Analyzes handwriting motor coordination, writing speed, and grammatical spelling error index.',
    scoreLabel: 'Orthographic Motor Precision'
  },
  math: {
    title: 'Mathematical Processing',
    desc: 'Parietal Lobe: Assesses concept recognition, calculation speed, and numerical sequencing consistency.',
    scoreLabel: 'Arithmetic Quantity Synthesis'
  }
};

class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ThreeJS Canvas crashed:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const BrainScene = ({
  isScanning: externalIsScanning = false,
  scanDuration = 4000,
  onScanComplete,
  scores = null,
  transparent = false,
  small = false
}) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [canvasCrashed, setCanvasCrashed] = useState(false);
  const [webglSupported] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  });
  
  // Scanning states
  const [isScanning, setIsScanning] = useState(externalIsScanning);
  const [scanProgress, setScanProgress] = useState(0);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Sync external scanning trigger
  useEffect(() => {
    setIsScanning(externalIsScanning);
    if (externalIsScanning) {
      setScanProgress(0);
      startTimeRef.current = performance.now();
      runScanLoop();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [externalIsScanning]);

  const runScanLoop = () => {
    const loop = (now) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / scanDuration, 1);
      
      setScanProgress(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        setIsScanning(false);
        if (onScanComplete) {
          onScanComplete();
        }
      }
    };
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const handleRegionClick = (pos) => {
    setSelectedPosition(pos);
  };

  const handleResetFocus = () => {
    setSelectedRegion(null);
    setSelectedPosition(null);
  };

  const renderSvgFallback = () => {
    return (
      <div className="w-full h-full flex items-center justify-center py-2 relative">
        <svg className="w-full h-full max-w-[420px] max-h-[260px] text-violet-400/80" viewBox="0 0 500 300" fill="none">
          <defs>
            <radialGradient id="glow-attention" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5B21B6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5B21B6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow-reading" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow-writing" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glow-math" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glowing regions under hovered or selected */}
          {(hoveredRegion === 'attention' || selectedRegion === 'attention') && (
            <circle cx="340" cy="120" r="70" fill="url(#glow-attention)" />
          )}
          {(hoveredRegion === 'reading' || selectedRegion === 'reading') && (
            <circle cx="190" cy="180" r="65" fill="url(#glow-reading)" />
          )}
          {(hoveredRegion === 'writing' || selectedRegion === 'writing') && (
            <circle cx="280" cy="90" r="65" fill="url(#glow-writing)" />
          )}
          {(hoveredRegion === 'math' || selectedRegion === 'math') && (
            <circle cx="180" cy="110" r="70" fill="url(#glow-math)" />
          )}

          {/* Outer Brain Shape (Stylized High-Tech Hologram Outline) */}
          <path 
            d="M 250,45 
               C 320,45 420,75 420,155 
               C 420,205 390,215 370,235 
               C 350,255 330,255 320,245 
               C 310,235 290,245 280,255 
               C 270,265 250,270 250,270 
               C 250,270 230,265 220,255 
               C 210,245 190,235 180,245 
               C 170,255 150,255 130,235 
               C 110,215 80,205 80,155 
               C 80,75 180,45 250,45 Z" 
            stroke="#a855f7" 
            strokeWidth="1.5" 
            strokeDasharray="4 3"
            fill="#8b5cf6" 
            fillOpacity="0.04" 
          />

          {/* Internal Brain Lobe Divisions */}
          <path 
            d="M 250,45 C 275,90 285,130 275,165 C 275,165 315,170 365,150 M 275,165 L 275,250" 
            stroke="#6366f1" 
            strokeWidth="1" 
            opacity="0.35" 
          />
          <path 
            d="M 120,145 C 180,155 220,162 275,165" 
            stroke="#6366f1" 
            strokeWidth="1" 
            opacity="0.35" 
          />

          {/* Hotspot Dots and Pulses */}
          {/* 1. Attention (Prefrontal) */}
          <g 
            className="cursor-pointer" 
            onClick={() => setSelectedRegion('attention')}
            onMouseEnter={() => setHoveredRegion('attention')}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle cx="340" cy="120" r="14" fill="#5B21B6" fillOpacity="0.15" />
            <circle cx="340" cy="120" r="5" fill="#5B21B6" stroke="#ffffff" strokeWidth="1" />
            {isScanning && scanProgress < 0.25 && (
              <circle cx="340" cy="120" r="18" stroke="#5B21B6" strokeWidth="1.5" fill="none" className="animate-ping" style={{ animationDuration: '1s' }} />
            )}
          </g>

          {/* 2. Reading (Temporal Lobe) */}
          <g 
            className="cursor-pointer" 
            onClick={() => setSelectedRegion('reading')}
            onMouseEnter={() => setHoveredRegion('reading')}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle cx="190" cy="180" r="14" fill="#8B5CF6" fillOpacity="0.15" />
            <circle cx="190" cy="180" r="5" fill="#8B5CF6" stroke="#ffffff" strokeWidth="1" />
            {isScanning && scanProgress >= 0.25 && scanProgress < 0.5 && (
              <circle cx="190" cy="180" r="18" stroke="#8B5CF6" strokeWidth="1.5" fill="none" className="animate-ping" style={{ animationDuration: '1s' }} />
            )}
          </g>

          {/* 3. Writing (Motor Cortex) */}
          <g 
            className="cursor-pointer" 
            onClick={() => setSelectedRegion('writing')}
            onMouseEnter={() => setHoveredRegion('writing')}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle cx="280" cy="90" r="14" fill="#C4B5FD" fillOpacity="0.15" />
            <circle cx="280" cy="90" r="5" fill="#C4B5FD" stroke="#ffffff" strokeWidth="1" />
            {isScanning && scanProgress >= 0.5 && scanProgress < 0.75 && (
              <circle cx="280" cy="90" r="18" stroke="#C4B5FD" strokeWidth="1.5" fill="none" className="animate-ping" style={{ animationDuration: '1s' }} />
            )}
          </g>

          {/* 4. Math (Parietal Lobe) */}
          <g 
            className="cursor-pointer" 
            onClick={() => setSelectedRegion('math')}
            onMouseEnter={() => setHoveredRegion('math')}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            <circle cx="180" cy="110" r="14" fill="#8B5CF6" fillOpacity="0.15" />
            <circle cx="180" cy="110" r="5" fill="#8B5CF6" stroke="#ffffff" strokeWidth="1" />
            {isScanning && scanProgress >= 0.75 && (
              <circle cx="180" cy="110" r="18" stroke="#8B5CF6" strokeWidth="1.5" fill="none" className="animate-ping" style={{ animationDuration: '1s' }} />
            )}
          </g>

          {/* Scanning Laser Beam Line */}
          {isScanning && (
            <line 
              x1="70" 
              y1={50 + scanProgress * 210} 
              x2="430" 
              y2={50 + scanProgress * 210} 
              stroke="#a855f7" 
              strokeWidth="2" 
              opacity="0.8"
              style={{ filter: 'drop-shadow(0px 0px 4px #a855f7)' }}
            />
          )}
        </svg>
      </div>
    );
  };

  const containerHeight = small ? "h-[320px]" : "h-[450px]";
  return (
    <div className={transparent 
      ? "relative w-full h-full overflow-hidden flex flex-col"
      : `relative w-full ${containerHeight} card overflow-hidden flex flex-col p-6 hover:scale-[1.01] transition-transform duration-300`
    }>
      {/* 3D Canvas Mount or 2D SVG Fallback */}
      <div className="flex-1 w-full relative flex items-center justify-center">
        {webglSupported && !canvasCrashed ? (
          <CanvasErrorBoundary 
            fallback={renderSvgFallback()} 
            onError={() => setCanvasCrashed(true)}
          >
            <Canvas
              camera={{ position: [0, 0, typeof window !== 'undefined' && window.innerWidth < 768 ? 5.6 : 4.2], fov: 45 }}
              style={{ background: 'transparent' }}
              gl={{ antialias: true, alpha: true }}
              dpr={[1, 2]}
            >
              {/* Lights */}
              <ambientLight intensity={0.7} />
              <pointLight position={[10, 10, 10]} intensity={1.5} color={transparent ? "#8b5cf6" : "#c4b5fd"} />
              <pointLight position={[-10, -10, -10]} intensity={0.8} color="#8b5cf6" />
              <directionalLight position={[0, 5, 0]} intensity={1.0} color="#ffffff" />

              {/* Surrounding background effects */}
              <FloatingParticles count={transparent ? 80 : 140} />
              <NeuralConnections count={transparent ? 15 : 25} />

              {/* Brain Model */}
              <BrainModel
                hoveredRegion={hoveredRegion}
                setHoveredRegion={setHoveredRegion}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                isScanning={isScanning}
                scanProgress={scanProgress}
                onRegionClick={handleRegionClick}
              />

              {/* Camera movement controller */}
              <CameraController selectedPosition={selectedPosition} isScanning={isScanning} />

              {/* Orbit Controls (disable panning to keep center focus) */}
              <OrbitControls
                enableDamping
                dampingFactor={0.06}
                minDistance={2.5}
                maxDistance={6.0}
                enablePan={false}
              />
            </Canvas>
          </CanvasErrorBoundary>
        ) : (
          renderSvgFallback()
        )}

        {/* HTML OVERLAYS */}

        {/* Floating cursor tooltips */}
        {!transparent && hoveredRegion && regionDetails[hoveredRegion] && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none p-4 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-lg text-left max-w-[280px] animate-fadeIn transition-all">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: hoveredRegion === 'attention' ? '#5B21B6' : hoveredRegion === 'reading' ? '#8B5CF6' : hoveredRegion === 'writing' ? '#C4B5FD' : '#8B5CF6' }} />
              <h4 className="font-extrabold text-sm text-white tracking-wide">{regionDetails[hoveredRegion].title}</h4>
            </div>
            <p className="text-white/60 text-xs leading-relaxed font-semibold">{regionDetails[hoveredRegion].desc}</p>
          </div>
        )}

        {/* Selected Region Detailed Panel */}
        {!transparent && selectedRegion && regionDetails[selectedRegion] && (
          <div className="absolute bottom-4 right-4 left-4 z-20 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-left">
              <h4 className="font-black text-sm text-purple-400 tracking-wide">{regionDetails[selectedRegion].title}</h4>
              <p className="text-white/65 text-xs font-semibold leading-relaxed mt-0.5 max-w-[420px]">{regionDetails[selectedRegion].desc}</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              {scores && scores[selectedRegion] !== undefined && (
                <div className="text-right">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest block">{regionDetails[selectedRegion].scoreLabel}</span>
                  <span className="text-lg font-black text-white">{scores[selectedRegion].toFixed(1)}%</span>
                </div>
              )}
              <button
                onClick={handleResetFocus}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
              >
                Reset Focus ↩
              </button>
            </div>
          </div>
        )}

        {/* Scan Progress Bar (when scanning is active) */}
        {isScanning && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center justify-center bg-slate-950/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest animate-pulse">
              [ Scanning Cognitive Neural Grid: {Math.round(scanProgress * 100)}% ]
            </span>
            <div className="w-48 bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#5B21B6] to-[#8B5CF6] rounded-full"
                style={{ width: `${scanProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Tech hud details inside canvas */}
        {!transparent && (
          <div className="absolute top-4 right-4 text-[9px] text-[#6B7280]/60 font-mono text-right pointer-events-none select-none">
            <div>MODEL: CEREBRAL_RF_V1</div>
            <div>SCANNER: ELECTRO_OPTIC_3D</div>
            <div>STATUS: {isScanning ? 'SCANNING...' : selectedRegion ? 'REGION_FOCUS' : 'FLOAT_IDLE'}</div>
          </div>
        )}
      </div>
      
      {/* Footer labels */}
      {!transparent && (
        <div className="flex justify-between items-center text-[10px] text-[#6B7280] font-mono tracking-widest border-t border-purple-100 pt-2 mt-2 pointer-events-none">
          <span>[ NEURAL CONNECTIONS ACTIVE ]</span>
          <span>DRAG TO ROTATE • SCROLL TO ZOOM</span>
        </div>
      )}
    </div>
  );
};

export default BrainScene;
