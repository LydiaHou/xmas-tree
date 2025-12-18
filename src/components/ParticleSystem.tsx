import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const COUNT = 2500; // Total 5000
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

// Neon / Glowing Christmas Palette
// Lighter shades to ensure strong bloom/glow
const COLORS = [
    '#FFFF00', '#FFF176', // Yellows (Bright)
    '#98FB98', '#CDDC39', // Greens (Mint/Lime)
    '#FF5252', '#FF1744', // Reds (Bright Neon Red)
    '#FFFFFF'             // White
];

const ParticleLayer = ({ geometryType }: { geometryType: 'box' | 'sphere' }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    const particles = useMemo(() => {
        const data = [];
        for (let i = 0; i < COUNT; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;

            // Weighted Color Logic (Mostly Green Tree)
            let color;
            const r = Math.random();
            if (r < 0.6) {
                // Greens
                color = r < 0.3 ? COLORS[2] : COLORS[3];
            }
            else if (r < 0.8) {
                // Reds
                color = r < 0.7 ? COLORS[4] : COLORS[5];
            }
            else if (r < 0.95) {
                // Gold/Yellow
                color = r < 0.9 ? COLORS[0] : COLORS[1];
            }
            else color = COLORS[6]; // White

            const scale = 0.5 + Math.random() * 0.5;
            data.push({ t, factor, xFactor, yFactor, zFactor, scale, phase: Math.random() * Math.PI * 2, mx: 0, my: 0, mz: 0, color });
        }
        return data;
    }, []);

    useLayoutEffect(() => {
        if (meshRef.current) {
            particles.forEach((p, i) => {
                tempColor.set(p.color);
                meshRef.current?.setColorAt(i, tempColor);
            });
            meshRef.current.instanceColor!.needsUpdate = true;
        }
    }, [particles]);

    // const { camera } = useThree();

    useFrame((state) => {
        const mesh = meshRef.current;
        if (!mesh) return;

        // READ STATE DIRECTLY
        const { handPosition, gesture } = useStore.getState();
        const time = state.clock.getElapsedTime();

        // Camera Parallax / Group Rotation based on hand
        // Move the group slightly opposite to hand to create depth
        if (groupRef.current) {
            const parallaxX = -handPosition.x * 0.5; // Invert and dampen
            const parallaxY = -handPosition.y * 0.5;

            // Smooth lerp
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, parallaxY * 0.1, 0.1);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, parallaxX * 0.1, 0.1);
        }

        particles.forEach((particle, i) => {
            let { t, factor, xFactor, yFactor, zFactor, scale, phase } = particle;

            let tx = 0, ty = 0, tz = 0;
            // Fix: using xFactor as x for explosion mode
            // This line is from the user's snippet, but the original code used x,y,z from particle.
            // Given the new particle structure, xFactor, yFactor, zFactor are the initial positions.
            // So, this line is correctly mapping the initial positions for the explosion direction.
            // const { x, y, z } = { x: particle.xFactor, y: particle.yFactor, z: particle.zFactor };

            if (gesture === 'FIST') {
                // SPIRAL CHRISTMAS TREE - DENSE & GLOWING
                const loops = 12;
                const height = 9.6; // Reduced to 80% of 12
                const pct = i / COUNT;

                const yPos = (pct * height) - (height / 2);
                const maxRadius = 3.6; // Reduced to 80% of 4.5
                const coneRadius = (1 - pct) * maxRadius;

                const bandThickness = 0.9; // Adjusted for smaller scale
                const radOffset = (Math.random() - 0.5) * bandThickness;
                const yOffset = (Math.random() - 0.5) * bandThickness;
                const angleOffset = (Math.random() - 0.5) * 0.5;

                const angle = pct * Math.PI * 2 * loops - time * 0.2 + angleOffset;

                tx = Math.cos(angle) * (coneRadius + radOffset);
                ty = yPos + yOffset;
                tz = Math.sin(angle) * (coneRadius + radOffset);

                tx += Math.sin(time * 1 + phase) * 0.02;
                ty += Math.cos(time * 1 + phase) * 0.02;
                tz += Math.sin(time * 1 + phase) * 0.02;

                // Particle Star removed -> Replaced by Pelican

            } else if (gesture === 'OPEN') {
                // EXPLOSION MODE
                const dir = new THREE.Vector3(xFactor, yFactor, zFactor).normalize();
                const expansion = 25 + Math.sin(time * 4) * 2;
                tx = dir.x * expansion;
                ty = dir.y * expansion;
                tz = dir.z * expansion;

            } else {
                // IDLE MODE
                // Compact Cloud
                tx = (Math.sin(t) * factor) * 0.2 + (Math.cos(t * 2) * 2);
                ty = (Math.cos(t) * factor) * 0.2 + (Math.sin(t * 3) * 2);
                tz = (Math.sin(t * 0.5) * factor) * 0.2;
            }

            // REPULSION FIELD (Magic Cursor)
            // Works in all modes to give "interactive" feel
            const dist = Math.sqrt(
                (tx - handPosition.x) ** 2 +
                (ty - handPosition.y) ** 2 +
                (tz - handPosition.z) ** 2
            );
            const repulsionRadius = 5;
            if (dist < repulsionRadius) {
                const force = (1 - dist / repulsionRadius) * 5;
                const dx = tx - handPosition.x;
                const dy = ty - handPosition.y;
                const dz = tz - handPosition.z;
                tx += (dx / dist) * force;
                ty += (dy / dist) * force;
                tz += (dz / dist) * force;
            }

            // Smooth Update (Lerp)
            particle.mx += (tx - particle.mx) * 0.1;
            particle.my += (ty - particle.my) * 0.1;
            particle.mz += (tz - particle.mz) * 0.1;

            tempObject.position.set(particle.mx, particle.my, particle.mz);

            // Rotate individual particle
            tempObject.rotation.x = time + i;
            tempObject.rotation.y = time * 0.5 + i;

            // Pulse scale
            let currentScale = scale;
            if (gesture === 'FIST' && i > COUNT - 50) currentScale *= 2;
            const s = currentScale * (0.8 + Math.sin(time * 5 + i) * 0.2);
            tempObject.scale.set(s, s, s);

            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <group ref={groupRef}>
            <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
                {geometryType === 'box' ? (
                    <boxGeometry args={[0.25, 0.25, 0.25]} /> // Slightly bigger
                ) : (
                    <sphereGeometry args={[0.18, 16, 16]} /> // Bigger spheres (ornaments)
                )}
                {/* USE BASIC MATERIAL FOR PURE GLOWING COLOR */}
                <meshBasicMaterial
                    toneMapped={false}
                    color="#ffffff"
                />
            </instancedMesh>
        </group>
    );
};

export const ParticleSystem = () => {
    return (
        <group>
            <ParticleLayer geometryType="box" />
            <ParticleLayer geometryType="sphere" />
        </group>
    );
};
