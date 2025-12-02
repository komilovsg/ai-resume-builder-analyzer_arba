import { useEffect, useRef, useState } from "react";

interface ScoreBarProps {
  value: number; // 0–100
}

const ScoreBar = ({ value }: ScoreBarProps) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    setAnimatedValue(0);

    const duration = 1500;
    const startTime = performance.now();
    const startValue = 0;
    const endValue = Math.max(0, Math.min(100, value));

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setAnimatedValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  const width = `${animatedValue}%`;

  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#FF97AD] to-[#5171FF]"
        style={{ width }}
      />
    </div>
  );
};

export default ScoreBar;


