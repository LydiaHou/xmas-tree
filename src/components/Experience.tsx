import { ParticleSystem } from './ParticleSystem';
import { ChristmasPelican } from './ChristmasPelican';
import { Cursor } from './Cursor';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';

export const Experience = () => {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 15]} />
            <OrbitControls makeDefault enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} />

            <color attach="background" args={['#000000']} />

            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ff0000" />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#0000ff" />

            {/* Content */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ChristmasPelican />
            <Cursor />
            <ParticleSystem />

            {/* Post Processing - Radiant Christmas Glow */}
            <EffectComposer>
                <Bloom
                    luminanceThreshold={0.1} // Lower threshold to make everything glow
                    mipmapBlur
                    intensity={1.5} // High intensity for "glowing" effect
                    radius={0.6}
                />
            </EffectComposer>
        </>
    );
};
