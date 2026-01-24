import { Area } from "react-easy-crop";

export const getCroppedImg = async (
    imageSrc: string,
    crop: Area,
    rotation = 0
): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const radians = (rotation * Math.PI) / 180;

    const width = image.width;
    const height = image.height;

    const rotatedWidth =
        Math.abs(Math.cos(radians) * width) +
        Math.abs(Math.sin(radians) * height);
    const rotatedHeight =
        Math.abs(Math.sin(radians) * width) +
        Math.abs(Math.cos(radians) * height);

    canvas.width = rotatedWidth;
    canvas.height = rotatedHeight;

    ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(image, -width / 2, -height / 2);

    const croppedCanvas = document.createElement("canvas");
    const croppedCtx = croppedCanvas.getContext("2d")!;

    croppedCanvas.width = crop.width;
    croppedCanvas.height = crop.height;

    croppedCtx.drawImage(
        canvas,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        croppedCanvas.toBlob((blob) => resolve(blob!), "image/jpeg");
    });
};

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = url;
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
