import { useState, useCallback, useEffect } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, Move } from "lucide-react";

interface ImageCropperProps {
    imageSrc: string;
    onCancel: () => void;
    onConfirm: (croppedAreaPixels: Area, rotation: number) => void;
}

export function ImageCropper({ imageSrc, onCancel, onConfirm }: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    const onCropComplete = useCallback(
        (_: Area, croppedPixels: Area) => {
            setCroppedAreaPixels(croppedPixels);
        },
        []
    );

    const handleZoomClick = (mode: "in" | "out") => {
        if (mode === "in") setZoom((z) => Math.min(z + 0.1, 3));
        else setZoom((z) => Math.max(z - 0.1, 1));
    };

    const handleRotationChange = (dir: "left" | "right") => {
        if (rotation >= 360 || rotation <= -360) setRotation(0);
        if (dir === "left") setRotation((r) => r - 90);
        else setRotation((r) => r + 90);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
            <div className="bg-white rounded-xl w-[900px] h-[600px] flex">

                {/* Cropper */}
                <div className="relative flex-1 bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                    />

                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex gap-1">
                        <Move className="w-3 h-3" /> Drag to move
                    </div>
                </div>

                {/* Controls */}
                <div className="w-[300px] p-6 flex flex-col gap-6 bg-white">

                    {/* Zoom */}
                    <div className="flex items-center gap-3">
                        <button
                        onClick={() => handleZoomClick("out")}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                        >
                        <ZoomOut className="w-5 h-5 text-gray-600" />
                        </button>

                        <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(+e.target.value)}
                        className="flex-1 accent-green-600"
                        />

                        <button
                        onClick={() => handleZoomClick("in")}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                        >
                        <ZoomIn className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Rotate */}
                    <div className="flex items-center gap-3">
                        <button
                        onClick={() => handleRotationChange("left")}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                        >
                        <RotateCcw className="w-5 h-5 text-gray-600" />
                        </button>

                        <button
                        onClick={() => handleRotationChange("right")}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                        >
                        <RotateCw className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-col gap-3">
                        <button
                        onClick={() => onConfirm(croppedAreaPixels, rotation)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
                        >
                        Confirm & Upload
                        </button>

                        <button
                        onClick={onCancel}
                        className="bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-semibold transition"
                        >
                        Cancel
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
