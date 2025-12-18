import { create } from 'zustand';
import * as THREE from 'three';

export type GestureType = 'IDLE' | 'PINCH' | 'OPEN' | 'FIST';

interface AppState {
    handPosition: THREE.Vector3;
    gesture: GestureType;
    interactionStrength: number;
    setHandPosition: (pos: THREE.Vector3) => void;
    setGesture: (gesture: GestureType) => void;
    setInteractionStrength: (strength: number) => void;
}

export const useStore = create<AppState>((set) => ({
    handPosition: new THREE.Vector3(0, 0, 0),
    gesture: 'IDLE',
    interactionStrength: 0,
    setHandPosition: (pos) => set({ handPosition: pos }),
    setGesture: (gesture) => set({ gesture }),
    setInteractionStrength: (strength) => set({ interactionStrength: strength }),
}));
