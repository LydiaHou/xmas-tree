import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

export const Cursor = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    useFrame(() => {
        if (!meshRef.current || !lightRef.current) return;

        // READ STATE DIRECTLY
        const { handPosition, gesture } = useStore.getState();

        // Smoothly follow hand
        meshRef.current.position.lerp(handPosition, 0.2);
        lightRef.current.position.copy(meshRef.current.position);

        // Visual feedback based on gesture
        if (gesture === 'PINCH') {
            meshRef.current.scale.setScalar(1.5);
            (meshRef.current.material as THREE.MeshBasicMaterial).color.set('#ffd700'); // Gold
        } else if (gesture === 'OPEN') {
            meshRef.current.scale.setScalar(2.0);
            (meshRef.current.material as THREE.MeshBasicMaterial).color.set('#00ffff'); // Cyan
        } else {
            meshRef.current.scale.setScalar(1.0);
            (meshRef.current.material as THREE.MeshBasicMaterial).color.set('#ffffff');
        }
    });

    return (
        <>
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.6} />
            </mesh>
            <pointLight ref={lightRef} distance={8} intensity={8} decay={2} color="white" />
        </>
    );
};
