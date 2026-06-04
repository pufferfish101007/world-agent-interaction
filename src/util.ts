export function degreesToRadians(degrees: number): number {
    return (Math.PI * degrees) / 180;
}

export function clamp(min: number, max: number, x: number): number {
    return Math.max(min, Math.min(max, x));
}
