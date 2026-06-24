import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Brain3D = () => {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [webglSupported, setWebglSupported] = React.useState(true);

  useEffect(() => {
    // If WebGL is not supported, do not attempt to run Three.js setup
    if (!webglSupported) return;

    const container = mountRef.current;
    if (!container) return;

    let renderer;
    let geometry;
    let material;
    let texture;
    let animationFrameId;
    let handleMouseMove;
    let handleResize;

    try {
      // ========================================
      // SCENE & CAMERA SETUP
      // ========================================
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 300;

      const scene = new THREE.Scene();
      
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 6;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // ========================================
      // GEOMETRY & PARTICLE GENERATION
      // ========================================
      const particleCount = 2800;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const originalPositions = new Float32Array(particleCount * 3);

      const colorViolet = new THREE.Color('#8b5cf6'); // Violet
      const colorPink = new THREE.Color('#ec4899');   // Pink
      const colorCyan = new THREE.Color('#06b6d4');   // Cyan

      for (let i = 0; i < particleCount; i++) {
        // Parametric ellipsoid coordinates
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;

        // Base ellipsoid dimensions
        const rx = 1.9;
        const ry = 1.35;
        const rz = 1.25;

        let x = rx * Math.sin(v) * Math.cos(u);
        let y = ry * Math.sin(v) * Math.sin(u);
        let z = rz * Math.cos(v);

        // 1. Separate hemispheres (longitudinal fissure)
        if (x > 0) {
          x += 0.12;
        } else {
          x -= 0.12;
        }

        // 2. Bumpy Gyri/Sulci folding noise
        const gyriFactor = 
          Math.sin(x * 5.0) * Math.cos(y * 5.0) * Math.sin(z * 5.0) * 0.14 +
          Math.sin(x * 12.0) * Math.cos(z * 12.0) * 0.04;
        
        const len = Math.sqrt(x * x + y * y + z * z);
        if (len > 0) {
          x += (x / len) * gyriFactor;
          y += (y / len) * gyriFactor;
          z += (z / len) * gyriFactor;
        }

        // 3. Taper bottom rear back to form cerebellum/stem
        if (y < -0.5) {
          x *= 0.5;
          z *= 0.5;
          y -= 0.1;
        }

        // Store positions
        const i3 = i * 3;
        positions[i3] = x;
        positions[i3 + 1] = y;
        positions[i3 + 2] = z;
        
        originalPositions[i3] = x;
        originalPositions[i3 + 1] = y;
        originalPositions[i3 + 2] = z;

        // Color mapping: interpolate color based on hemisphere and vertical position
        let mixColor;
        if (y < -0.5) {
          // Cerebellum has a glowing cyan/blue look
          mixColor = colorCyan.clone().lerp(colorViolet, 0.3);
        } else {
          // Left hemisphere is cyan-violet, right hemisphere is pink-violet
          const hemisphereColor = x > 0 ? colorPink : colorCyan;
          const verticalFactor = (y + ry) / (ry * 2); // 0 to 1
          mixColor = hemisphereColor.clone().lerp(colorViolet, verticalFactor);
        }

        colors[i3] = mixColor.r;
        colors[i3 + 1] = mixColor.g;
        colors[i3 + 2] = mixColor.b;
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      // Create custom circle particle texture
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
      
      texture = new THREE.CanvasTexture(canvas);

      material = new THREE.PointsMaterial({
        size: 0.1,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const brainPoints = new THREE.Points(geometry, material);
      scene.add(brainPoints);

      // ========================================
      // INTERACTION LISTENERS
      // ========================================
      handleMouseMove = (event) => {
        const rect = container.getBoundingClientRect();
        const clientX = event.clientX - rect.left;
        const clientY = event.clientY - rect.top;
        
        // Map to normalized range [-1, 1]
        mouseRef.current.targetX = (clientX / width) * 2 - 1;
        mouseRef.current.targetY = -(clientY / height) * 2 + 1;
      };

      container.addEventListener('mousemove', handleMouseMove);

      // ========================================
      // ANIMATION LOOP (Custom Clock to avoid Three.js Clock deprecation)
      // ========================================
      class CustomClock {
        constructor() {
          this.startTime = performance.now();
        }
        getElapsedTime() {
          return (performance.now() - this.startTime) / 1000;
        }
      }
      const clock = new CustomClock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const time = clock.getElapsedTime();
        
        // Interpolate mouse coordinates for smooth rotation physics (damping)
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

        // Base rotation + mouse interaction
        brainPoints.rotation.y = time * 0.15 + mouseRef.current.x * 0.5;
        brainPoints.rotation.x = mouseRef.current.y * 0.4;
        brainPoints.rotation.z = Math.sin(time * 0.5) * 0.05;

        // Subtle wave pulse effect on points
        const positionAttr = geometry.attributes.position;
        const pArr = positionAttr.array;
        
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const ox = originalPositions[i3];
          const oy = originalPositions[i3 + 1];
          const oz = originalPositions[i3 + 2];

          // Pulsate particles using sine wave relative to distance from center
          const distance = Math.sqrt(ox * ox + oy * oy + oz * oz);
          const wave = Math.sin(time * 2.0 - distance * 1.5) * 0.025;

          pArr[i3] = ox + (ox / distance) * wave;
          pArr[i3 + 1] = oy + (oy / distance) * wave;
          pArr[i3 + 2] = oz + (oz / distance) * wave;
        }
        
        positionAttr.needsUpdate = true;

        renderer.render(scene, camera);
      };

      animate();

      // ========================================
      // RESIZE HANDLING
      // ========================================
      handleResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);
    } catch (err) {
      console.warn("WebGL not supported or context creation failed in Brain3D. Falling back to 2D.", err);
      setWebglSupported(false);
    }

    // ========================================
    // CLEANUP
    // ========================================
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer && renderer.domElement && container && container.contains(renderer.domElement)) {
        try {
          container.removeChild(renderer.domElement);
        } catch (e) {
          // Ignore
        }
      }
      if (handleMouseMove && container) container.removeEventListener('mousemove', handleMouseMove);
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (texture) texture.dispose();
      if (renderer) renderer.dispose();
    };
  }, [webglSupported]);

  // Fallback 2D UI when WebGL fails
  if (!webglSupported) {
    return (
      <div className="relative w-full h-72 bg-slate-950/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6">
        {/* Background soft glow circles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-pink-600/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          {/* Animated Stylized 2D High-Tech Brain SVG */}
          <svg className="w-24 h-24 text-violet-400/80 animate-pulse" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Left Hemisphere */}
            <path d="M32,12 C24,12 16,16 16,24 C16,28 18,30 18,34 C18,36 14,40 14,44 C14,48 18,52 24,52 C26,52 28,50 30,50 L32,50" strokeLinecap="round" strokeLinejoin="round" />
            {/* Right Hemisphere */}
            <path d="M32,12 C40,12 48,16 48,24 C48,28 46,30 46,34 C46,36 50,40 50,44 C50,48 46,52 40,52 C38,52 36,50 34,50 L32,50" strokeLinecap="round" strokeLinejoin="round" />
            {/* Brain Stem & Cerebellum */}
            <path d="M32,50 L32,58" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28,58 L36,58" strokeLinecap="round" strokeLinejoin="round" />
            {/* Internal lobes / Gyri curves */}
            <path d="M24,20 C20,24 22,28 26,28" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M40,20 C44,24 42,28 38,28" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M20,32 C26,34 26,38 22,42" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M44,32 C38,34 38,38 42,42" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            <path d="M32,20 L32,44" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" strokeDasharray="2 2" />
          </svg>
          <div className="space-y-1">
            <h4 className="text-white/80 font-mono text-[11px] tracking-widest uppercase">[ NEURAL ENGINE ACTIVE ]</h4>
            <p className="text-white/40 text-[10px] font-mono">2D VECTOR MAP LOADED (GPU SAFE)</p>
          </div>
        </div>
        
        {/* Interactive Labels */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-white/50 font-mono tracking-widest pointer-events-none">
          <span>[ CORTEX ONLINE ]</span>
          <span>SYSTEM RUNNING SAFE MODE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-950/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center p-4">
      {/* Background soft glow circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-pink-600/10 blur-3xl rounded-full pointer-events-none" />
      
      {/* 3D Render Mount */}
      <div ref={mountRef} className="w-full h-72 cursor-grab active:cursor-grabbing" />
      
      {/* Interactive Labels */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-white/50 font-mono tracking-widest pointer-events-none">
        <span>[ CORTEX ACTIVE ]</span>
        <span>ROTATE: POINTER MOVEMENTS</span>
      </div>
    </div>
  );
};

export default Brain3D;
