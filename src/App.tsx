import { Canvas } from '@react-three/fiber';
import { HandTracker } from './components/HandTracker';
import { Experience } from './components/Experience';
// import { useStore } from './store'; // Unused now
import { Suspense } from 'react';

function App() {
    // const { gesture } = useStore();

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans select-none cursor-none">
            {/* 3D Scene Layer */}
            <div className="absolute inset-0 z-0">
                <Canvas dpr={[1, 2]}>
                    <Suspense fallback={null}>
                        <Experience />
                    </Suspense>
                </Canvas>
            </div>

            {/* UI Overlay Layer - Title & Subtitle */}
            <div className="absolute inset-0 z-10 pointer-events-none p-8 flex flex-col items-center pt-12">
                <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-red-200 to-green-200 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] text-center tracking-wider">
                    Lydia Gesture Interactive Christmas Tree! 🎄
                </h1>
                <p className="mt-4 text-xl md:text-2xl text-white/90 font-light tracking-[0.2em] animate-pulse drop-shadow-md">
                    Raise your hand!
                </p>

                {/* Technical Description Footer */}
                <div className="absolute bottom-8 text-center px-4">
                    <p className="text-[10px] md:text-xs text-white/40 font-mono tracking-widest uppercase">
                        A premium 3D particle experience controlled by hand gestures. Built with React, Three.js, and MediaPipe.
                    </p>
                </div>
            </div>

            {/* Vision Module (Interactive) */}
            <div className="absolute bottom-0 left-0 z-50 pointer-events-auto">
                <HandTracker />
            </div>
        </div>
    );
}

export default App;
