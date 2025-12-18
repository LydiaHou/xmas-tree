import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useStore } from '../store';

export const ChristmasPelican = () => {
    const ref = useRef<THREE.Group>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useLoader(TextureLoader, 'pelican_star.png'); // Use relative path for GH Pages compatibility

    useFrame((state) => {
        if (!ref.current) return;
        const time = state.clock.getElapsedTime();
        const { gesture } = useStore.getState();

        if (gesture === 'FIST') {
            // TREE TOPPER MODE
            // Tree height is 9.6, top is at 9.6 / 2 = 4.8.
            // Move pelican to roughly 5.2 to sit nicely on top.
            const targetPos = new THREE.Vector3(0, 5.2, 0);

            ref.current.position.lerp(targetPos, 0.1);

            // Subtle hover at the top
            ref.current.position.y += Math.sin(time * 2) * 0.05;
            ref.current.rotation.z = Math.sin(time) * 0.1; // Gentle wobble

            // Fixed size for topper
            ref.current.scale.setScalar(2.5);

        } else {
            // IDLE / FLOATING MODE
            // Fly in a sine wave path
            ref.current.position.x = Math.sin(time * 0.5) * 6;
            ref.current.position.y = Math.cos(time * 0.3) * 2 + 1;
            ref.current.position.z = Math.sin(time * 0.4) * 4;

            ref.current.rotation.z = Math.sin(time) * 0.2;
            ref.current.scale.setScalar(2.0); // Slightly smaller when floating

            // Face direction (rudimentary flip)
            const velocityX = Math.cos(time * 0.5);
            if (meshRef.current) meshRef.current.scale.x = velocityX > 0 ? -1 : 1;
        }
    });

    return (
        <group ref={ref}>
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <mesh ref={meshRef}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial
                        map={texture}
                        transparent
                        blending={THREE.NormalBlending}
                        depthWrite={false}
                    />
                </mesh>
            </Billboard>
        </group>
    );
};
