import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const transitions = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30
  },
  smooth: {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  }
};