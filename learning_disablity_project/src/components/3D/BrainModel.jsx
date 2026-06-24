import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Fallback Procedural Solid Glowing Brain Component
const ProceduralBrain = ({ hoveredRegion, selectedRegion, isScanning, scanProgress }) => {
  const groupRef = useRef();
  const pointsRef = useRef();
  const [hovered, setHovered] = useState(false);

  // 1. Generate procedural particle brain geometry
  const particleCount = 2200;
  const [particlePositions, particleColors, originalPositions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const orig = new Float32Array(particleCount * 3);

    const colorViolet = new THREE.Color('#8b5cf6'); // Accent Purple
    const colorPink = new THREE.Color('#5b21b6');   // Primary Purple
    const colorCyan = new THREE.Color('#c4b5fd');   // Light Lavender

    for (let i = 0; i < particleCount; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI;

      // Base shape dimensions
      const rx = 1.3;
      const ry = 0.95;
      const rz = 0.95;

      let x = rx * Math.sin(v) * Math.cos(u);
      let y = ry * Math.sin(v) * Math.sin(u);
      let z = rz * Math.cos(v);

      // Separate hemispheres (longitudinal fissure)
      if (x > 0) {
        x += 0.08;
      } else {
        x -= 0.08;
      }

      // Bumpy Gyri/Sulci folding noise
      const gyriFactor = 
        Math.sin(x * 5.0) * Math.cos(y * 5.0) * Math.sin(z * 5.0) * 0.12 +
        Math.sin(x * 12.0) * Math.cos(z * 12.0) * 0.03;
      
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        x += (x / len) * gyriFactor;
        y += (y / len) * gyriFactor;
        z += (z / len) * gyriFactor;
      }

      // Taper bottom rear to form cerebellum
      if (y < -0.3) {
        x *= 0.55;
        z *= 0.55;
        y -= 0.08;
      }

      const i3 = i * 3;
      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      orig[i3] = x;
      orig[i3 + 1] = y;
      orig[i3 + 2] = z;

      // Color mapping: left hemisphere is cyan-violet, right is pink-violet, cerebellum is cyan-blue
      let mixColor;
      if (y < -0.3) {
        mixColor = colorCyan.clone().lerp(colorViolet, 0.3);
      } else {
        const hemisphereColor = x > 0 ? colorPink : colorCyan;
        const verticalFactor = (y + ry) / (ry * 2);
        mixColor = hemisphereColor.clone().lerp(colorViolet, verticalFactor);
      }

      col[i3] = mixColor.r;
      col[i3 + 1] = mixColor.g;
      col[i3 + 2] = mixColor.b;
    }

    return [pos, col, orig];
  }, []);

  // 2. Custom circular soft particle texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  // 3. Animation and interaction update loop
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.12;
      // Continuous rotation (slows down during scanning)
      groupRef.current.rotation.y = isScanning ? t * 0.05 : t * 0.15;
      // Hover zoom effect
      const targetScale = hovered ? 1.25 : 1.0;
      const currentScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08);
      groupRef.current.scale.set(newScale, newScale, newScale);
    }

    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position;
    const colAttr = geometry.attributes.color;
    
    const pArr = posAttr.array;
    const cArr = colAttr.array;

    // Define hotspot locations to calculate distance in model space
    const regions = {
      attention: new THREE.Vector3(0.0, 0.4, 0.95),
      reading: new THREE.Vector3(-0.95, 0.05, 0.15),
      writing: new THREE.Vector3(-0.35, 0.7, 0.35),
      math: new THREE.Vector3(0.65, 0.55, -0.45)
    };

    // Determine target region for scanning highlight
    let scanningActiveRegion = null;
    if (isScanning) {
      if (scanProgress < 0.25) scanningActiveRegion = 'attention';
      else if (scanProgress < 0.5) scanningActiveRegion = 'reading';
      else if (scanProgress < 0.75) scanningActiveRegion = 'writing';
      else scanningActiveRegion = 'math';
    }

    const activeRegion = hoveredRegion || selectedRegion || scanningActiveRegion;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      // Subtle breathing pulse based on distance from center
      const centerDist = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const wave = Math.sin(t * 2.2 - centerDist * 1.8) * 0.015;
      
      pArr[i3] = ox + (ox / centerDist) * wave;
      pArr[i3 + 1] = oy + (oy / centerDist) * wave;
      pArr[i3 + 2] = oz + (oz / centerDist) * wave;

      // Base colors
      let r = particleColors[i3];
      let g = particleColors[i3 + 1];
      let b = particleColors[i3 + 2];

      // Highlight particles near active/hovered region
      if (activeRegion && regions[activeRegion]) {
        const targetPos = regions[activeRegion];
        const px = pArr[i3];
        const py = pArr[i3 + 1];
        const pz = pArr[i3 + 2];

        const distToTarget = Math.sqrt(
          (px - targetPos.x) ** 2 +
          (py - targetPos.y) ** 2 +
          (pz - targetPos.z) ** 2
        );

        if (distToTarget < 0.65) {
          const factor = (0.65 - distToTarget) / 0.65; // 0 to 1
          
          let blendColor = new THREE.Color();
          if (activeRegion === 'attention') blendColor.set('#5B21B6'); // purple-primary
          else if (activeRegion === 'reading') blendColor.set('#8B5CF6'); // purple-accent
          else if (activeRegion === 'writing') blendColor.set('#C4B5FD'); // lavender
          else if (activeRegion === 'math') blendColor.set('#FFFFFF'); // white

          // Blend with dynamic brightness boost
          r = THREE.MathUtils.lerp(r, blendColor.r * 1.6, factor);
          g = THREE.MathUtils.lerp(g, blendColor.g * 1.6, factor);
          b = THREE.MathUtils.lerp(b, blendColor.b * 1.6, factor);
        }
      }

      // Scanning wave beam color overlay
      if (isScanning) {
        const scanY = 1.0 - (scanProgress * 2.0); // maps progress 0..1 to Y coordinate 1..-1
        const yDist = Math.abs(pArr[i3 + 1] - scanY);
        if (yDist < 0.15) {
          const scanFactor = (0.15 - yDist) / 0.15;
          // Glowing light purple laser line
          r = THREE.MathUtils.lerp(r, 1.8, scanFactor);
          g = THREE.MathUtils.lerp(g, 1.2, scanFactor);
          b = THREE.MathUtils.lerp(b, 2.5, scanFactor);
        }
      }

      cArr[i3] = r;
      cArr[i3 + 1] = g;
      cArr[i3 + 2] = b;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <group 
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      {/* 3D Dynamic Particle Cloud Core */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[particleColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.075}
          map={particleTexture}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Holographic Solid Shell - Left Hemisphere */}
      <mesh position={[-0.45, 0.1, 0]} scale={[0.8, 0.7, 1.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={hoveredRegion === 'reading' || hoveredRegion === 'writing' ? '#8B5CF6' : '#5B21B6'}
          wireframe={false}
          transparent
          opacity={hoveredRegion === 'reading' || hoveredRegion === 'writing' ? 0.65 : 0.45}
          emissive={hoveredRegion === 'reading' || hoveredRegion === 'writing' ? '#C4B5FD' : '#8B5CF6'}
          emissiveIntensity={hoveredRegion === 'reading' || hoveredRegion === 'writing' ? 1.5 : 0.6}
          roughness={0.15}
          metalness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transmission={0.6}
          thickness={0.8}
        />
      </mesh>

      {/* Holographic Solid Shell - Right Hemisphere */}
      <mesh position={[0.45, 0.1, 0]} scale={[0.8, 0.7, 1.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={hoveredRegion === 'math' ? '#C4B5FD' : '#8B5CF6'}
          wireframe={false}
          transparent
          opacity={hoveredRegion === 'math' ? 0.65 : 0.45}
          emissive={hoveredRegion === 'math' ? '#FFFFFF' : '#8B5CF6'}
          emissiveIntensity={hoveredRegion === 'math' ? 1.5 : 0.6}
          roughness={0.15}
          metalness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transmission={0.6}
          thickness={0.8}
        />
      </mesh>

      {/* Holographic Solid Shell - Cerebellum */}
      <mesh position={[0, -0.45, -0.55]} scale={[0.6, 0.32, 0.5]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color="#5B21B6"
          wireframe={false}
          transparent
          opacity={0.5}
          emissive="#8B5CF6"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.2}
          clearcoat={0.8}
          transmission={0.5}
        />
      </mesh>

      {/* Holographic Solid Shell - Brain Stem */}
      <mesh position={[0, -0.85, -0.22]} rotation={[0.15, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.1, 0.7, 16]} />
        <meshPhysicalMaterial
          color="#8B5CF6"
          wireframe={false}
          transparent
          opacity={0.45}
          emissive="#C4B5FD"
          emissiveIntensity={0.4}
          roughness={0.2}
          metalness={0.2}
          clearcoat={0.8}
          transmission={0.5}
        />
      </mesh>
    </group>
  );
};

// GLB Loader Component (Pre-wrapped in a component to use useGLTF only when available)
const GltfBrainModel = ({ url, isScanning }) => {
  const { scene } = useGLTF(url);
  const modelRef = useRef();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Traverse the scene and set custom materials for a glowing realistic look
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color('#8b5cf6'),
          emissive: new THREE.Color('#2D1B69'),
          emissiveIntensity: 1.5,
          wireframe: false,
          transparent: true,
          opacity: 0.9,
          roughness: 0.1,
          metalness: 0.25,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          transmission: 0.45,
          thickness: 1.2
        });
      }
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (modelRef.current) {
      // Floating animation
      modelRef.current.position.y = Math.sin(t * 1.5) * 0.12;
      // Auto-rotation
      if (!isScanning) {
        modelRef.current.rotation.y = t * 0.12;
      }
      // Hover zoom effect
      const targetScale = hovered ? 1.9 : 1.6;
      const currentScale = modelRef.current.scale.x;
      const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08);
      modelRef.current.scale.set(newScale, newScale, newScale);
    }
  });

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={1.6} 
      position={[0, -0.1, 0]} 
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    />
  );
};

const BrainModel = ({
  hoveredRegion,
  setHoveredRegion,
  selectedRegion,
  setSelectedRegion,
  isScanning,
  scanProgress,
  onRegionClick
}) => {
  const [modelExists, setModelExists] = useState(false);
  const { camera } = useThree();

  // Interactive hotspots corresponding to standard lobes
  const hotspots = [
    {
      id: 'attention',
      name: 'Attention Tracking',
      label: 'Attention Lobe',
      position: [0.0, 0.4, 0.95],
      color: '#5B21B6',
      emissive: '#C4B5FD',
    },
    {
      id: 'reading',
      name: 'Reading Analysis',
      label: 'Temporal Lobe',
      position: [-0.95, 0.05, 0.15],
      color: '#8B5CF6',
      emissive: '#FFFFFF',
    },
    {
      id: 'writing',
      name: 'Writing Assessment',
      label: 'Motor Cortex',
      position: [-0.35, 0.7, 0.35],
      color: '#C4B5FD',
      emissive: '#FFFFFF',
    },
    {
      id: 'math',
      name: 'Mathematical Processing',
      label: 'Parietal Lobe',
      position: [0.65, 0.55, -0.45],
      color: '#8B5CF6',
      emissive: '#C4B5FD',
    }
  ];

  useEffect(() => {
    // Check if the online GLB file is available
    const glbUrl = 'https://raw.githubusercontent.com/savir2010/Aurna/main/brain.glb';
    fetch(glbUrl)
      .then(async (res) => {
        if (res.ok) {
          setModelExists(true);
        } else {
          setModelExists(false);
        }
      })
      .catch(() => setModelExists(false));
  }, []);

  // Handle region clicks for camera centering
  const handleHotspotClick = (spot) => {
    setSelectedRegion(spot.id);
    if (onRegionClick) {
      onRegionClick(spot.position);
    }
  };

  // Laser scanner ring coordinates during diagnosis scan
  const scanY = 1.0 - (scanProgress * 2.0); // maps 0..1 to 1..-1

  return (
    <group>
      {/* 3D Brain Core (GLB or Procedural Fallback) */}
      {modelExists ? (
        <GltfBrainModel url="https://raw.githubusercontent.com/savir2010/Aurna/main/brain.glb" isScanning={isScanning} />
      ) : (
        <ProceduralBrain
          hoveredRegion={hoveredRegion}
          selectedRegion={selectedRegion}
          isScanning={isScanning}
          scanProgress={scanProgress}
        />
      )}

      {/* Laser Scanning Grid Plane (Visible when scanning is active) */}
      {isScanning && (
        <mesh position={[0, scanY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 1.8, 64]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Interactive Region Hotspot Spheres */}
      {hotspots.map((spot) => {
        const isHovered = hoveredRegion === spot.id;
        const isSelected = selectedRegion === spot.id;
        const scale = isHovered ? 0.16 : isSelected ? 0.14 : 0.09;
        
        // Flash active hotspots sequentially during scanning
        const isScanningPulse =
          isScanning &&
          ((spot.id === 'attention' && scanProgress < 0.25) ||
            (spot.id === 'reading' && scanProgress >= 0.25 && scanProgress < 0.5) ||
            (spot.id === 'writing' && scanProgress >= 0.5 && scanProgress < 0.75) ||
            (spot.id === 'math' && scanProgress >= 0.75));

        return (
          <mesh
            key={spot.id}
            position={spot.position}
            onClick={(e) => {
              e.stopPropagation();
              handleHotspotClick(spot);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
              setHoveredRegion(spot.id);
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              document.body.style.cursor = 'default';
              setHoveredRegion(null);
            }}
          >
            <sphereGeometry args={[scale, 32, 32]} />
            <meshPhysicalMaterial
              color={isScanningPulse ? '#c084fc' : spot.color}
              emissive={isScanningPulse ? '#f3e8ff' : spot.emissive}
              emissiveIntensity={isHovered || isScanningPulse ? 2.5 : 1.0}
              transparent
              opacity={0.85}
              roughness={0.1}
              metalness={0.9}
              clearcoat={1.0}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default BrainModel;
