import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeuralConnections = ({ count = 30 }) => {
  const lineRef = useRef();

  const [positions, indices] = useMemo(() => {
    // Generate nodes inside the spherical region, then link pairs that are close
    const nodeCount = count * 2;
    const pos = new Float32Array(nodeCount * 3);
    
    for (let i = 0; i < nodeCount; i++) {
      const i3 = i * 3;
      const r = 1.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
    }
    
    const idxs = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const i3 = i * 3;
        const j3 = j * 3;
        const dx = pos[i3] - pos[j3];
        const dy = pos[i3 + 1] - pos[j3 + 1];
        const dz = pos[i3 + 2] - pos[j3 + 2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Link nodes that fall within connection distance
        if (dist < 1.3) {
          idxs.push(i, j);
        }
      }
    }
    
    return [pos, new Uint16Array(idxs)];
  }, [count]);

  useFrame((state) => {
    if (lineRef.current) {
      const time = state.clock.getElapsedTime();
      // Slowly rotate neural connections to give an alive feeling
      lineRef.current.rotation.y = time * 0.06;
      lineRef.current.rotation.z = Math.sin(time * 0.1) * 0.04;
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="index"
          args={[indices, 1]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#c084fc"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
};

export default NeuralConnections;
