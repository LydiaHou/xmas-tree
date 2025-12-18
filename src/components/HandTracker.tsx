import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import * as THREE from 'three';

export const HandTracker = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { setHandPosition, setGesture, setInteractionStrength } = useStore();
    const [status, setStatus] = useState<string>('INITIALIZING...');

    useEffect(() => {
        let handLandmarker: HandLandmarker;
        let animationFrameId: number;

        const setup = async () => {
            try {
                setStatus('LOADING MODEL...');
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
                );
                handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: 'GPU',
                    },
                    runningMode: 'VIDEO',
                    numHands: 1,
                });

                startWebcam();
            } catch (err) {
                console.error(err);
                setStatus('MODEL FAILED');
            }
        };

        const startWebcam = async () => {
            if (!videoRef.current) return;
            setStatus('STARTING CAM...');

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720 },
                });
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener('loadeddata', () => {
                    setStatus('ACTIVE');
                    predictWebcam();
                });
            } catch (err) {
                console.error("Webcam access denied", err);
                setStatus('CAM BLOCKED');
            }
        };

        const predictWebcam = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (!video || !canvas || !handLandmarker) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            // Mirror effect
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);

            let startTimeMs = performance.now();
            const results = handLandmarker.detectForVideo(video, startTimeMs);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Draw video frame to verify camera is working
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];
                drawSkeleton(ctx, landmarks);
                processGestures(landmarks);
            } else {
                setGesture('IDLE');
                setInteractionStrength(0);
            }

            ctx.restore();
            animationFrameId = requestAnimationFrame(predictWebcam);
        };

        const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[]) => {
            const drawingUtils = new DrawingUtils(ctx);
            drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                color: '#00ffd4',
                lineWidth: 4,
            });
            drawingUtils.drawLandmarks(landmarks, {
                color: '#ffd700',
                lineWidth: 2,
                radius: 4,
            });
        };

        const processGestures = (landmarks: NormalizedLandmark[]) => {
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // Wrist
            const wrist = landmarks[0];

            // Map hand position to screen space
            // MediaPipe: x [0,1], y [0,1]. (0,0) is top-left.
            const x = (1 - indexTip.x) * 2 - 1;
            const y = -(indexTip.y * 2 - 1);

            setHandPosition(new THREE.Vector3(x * 12, y * 8, 0));

            // FIST DETECTION (Closed Hand)
            // Check if fingertips are below PIP joints (or close to palm)
            const isFingerDown = (tipIdx: number, pipIdx: number) => {
                return landmarks[tipIdx].y > landmarks[pipIdx].y; // y increases downwards
            };

            const indexClosed = isFingerDown(8, 6);
            const middleClosed = isFingerDown(12, 10);
            const ringClosed = isFingerDown(16, 14);
            const pinkyClosed = isFingerDown(20, 18);

            // Simple Fist: 4 non-thumb fingers closed
            const isFist = indexClosed && middleClosed && ringClosed && pinkyClosed;

            // Pinch (Thumb + Index close) - OLD
            const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
            const isPinch = pinchDist < 0.08;

            // Open Hand (All tips far from wrist)
            const tips = [8, 12, 16, 20].map(i => landmarks[i]);
            const avgDist = tips.reduce((acc, tip) => acc + Math.hypot(tip.x - wrist.x, tip.y - wrist.y), 0) / 4;
            const isOpen = avgDist > 0.3 && !isFist; // Priority to Fist

            if (isFist) {
                setGesture('FIST');
                setInteractionStrength(1);
            } else if (isOpen) {
                setGesture('OPEN');
                setInteractionStrength(1);
            } else if (isPinch) {
                setGesture('PINCH'); // Keep as fallback/variant? User implies FIST is the new Tree trigger.
                setInteractionStrength(0.8);
            } else {
                setGesture('IDLE');
                setInteractionStrength(0.5);
            }
        };

        setup();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [setHandPosition, setGesture, setInteractionStrength]);

    return (
        <div className="fixed bottom-4 left-4 w-64 h-48 rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-lg z-50">
            <div className="relative w-full h-full bg-black/80 backdrop-blur-md flex items-center justify-center">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                    playsInline
                    muted
                    autoPlay
                />
                <canvas
                    ref={canvasRef}
                    className="w-full h-full object-cover transform scale-x-[-1]"
                />
                <div className="absolute top-2 left-2 text-xs text-white/90 font-mono bg-black/50 px-2 py-1 rounded border border-white/20">
                    STATUS: {status}
                </div>
            </div>
        </div>
    );
};
