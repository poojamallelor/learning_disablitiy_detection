import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FloatingParticles = ({ count = 180 }) => {
  const pointsRef = useRef();

  const [positions, speeds, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const phs = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Generate particles in a spherical zone enclosing the brain
      const r = 2.2 + Math.random() * 3.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
      
      spd[i] = 0.15 + Math.random() * 0.3;
      
      phs[i3] = Math.random() * Math.PI * 2;
      phs[i3 + 1] = Math.random() * Math.PI * 2;
      phs[i3 + 2] = Math.random() * Math.PI * 2;
    }
    
    return [pos, spd, phs];
  }, [count]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position;
    const array = positionAttr.array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Sinusoidal orbital float animation
      array[i3] += Math.sin(time * speeds[i] + phases[i3]) * 0.003;
      array[i3 + 1] += Math.cos(time * speeds[i] + phases[i3 + 1]) * 0.003;
      array[i3 + 2] += Math.sin(time * speeds[i] + phases[i3 + 2]) * 0.003;
    }
    positionAttr.needsUpdate = true;
  });

  // Dynamic circular glow texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        map={texture}
        color="#a78bfa"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default FloatingParticles;
