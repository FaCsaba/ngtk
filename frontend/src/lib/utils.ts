import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toBytes(number: number, size: number): number[] {
  const bytes = new Uint8ClampedArray(size);
  let x = number;
  for (let i = (size - 1); i >= 0; i--) {
    const rightByte = x & 0xff;
    bytes[i] = rightByte;
    x = Math.floor(x / 0x100);
  }

  const a =  Array.from(bytes);
  return a;
}