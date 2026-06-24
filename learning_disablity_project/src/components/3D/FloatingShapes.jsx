import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere, Box } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const FloatingShape = ({ color, speed = 1, size = 1 }) => {
  const mesh = useRef();

  useFrame(() => {
    if (mesh.current) {
      mesh.current.rotation.x += 0.001 * speed;
      mesh.current.rotation.y += 0.002 * speed;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={2}>
      <Sphere 
        ref={mesh} 
        args={[size, 32, 32]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>
    </Float>
  );
};

export const FloatingShapes = () => {
  return null;
};

export const AnimatedBrain = () => {
  return (
    <Canvas
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      camera={{ position: [0, 0, 12], fov: 75 }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[0, 20, 10]} intensity={0.8} color="#7C3AED" />
      
      <FloatingShape color="#667EEA" speed={2} size={2} />
      <Float speed={2} rotationIntensity={2} floatIntensity={3}>
        <Box args={[2, 2, 2]} castShadow receiveShadow>
          <meshStandardMaterial 
            color="#764BA2"
            emissive="#667EEA"
            emissiveIntensity={0.3}
            roughness={0.4}
            metalness={0.6}
            wireframe={true}
          />
        </Box>
      </Float>
    </Canvas>
  );
};
