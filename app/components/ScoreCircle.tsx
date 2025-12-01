import { useEffect, useState, useRef } from "react";

const ScoreCircle = ({ score = 75 }: { score: number }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const animationRef = useRef<number | null>(null);
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = animatedScore / 100;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    // Сбрасываем анимацию при изменении score
    setAnimatedScore(0);

    // Анимация заполнения от 0 до score
    const duration = 2000; // 2 секунды для более плавной анимации
    const startTime = performance.now();
    const startValue = 0;
    const endValue = score;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Более плавная easing функция (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      // Обновляем одновременно и счетчик, и визуальное заполнение
      setAnimatedScore(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedScore(endValue);
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup при размонтировании или изменении score
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score]);

  return (
    <div className="relative w-[80px] h-[80px]">
      <svg
        height="100%"
        width="100%"
        viewBox="0 0 100 100"
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          stroke="#e5e7eb"
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* Partial circle with gradient */}
        <defs>
          <linearGradient id="grad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF97AD" />
            <stop offset="100%" stopColor="#5171FF" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r={normalizedRadius}
          stroke="url(#grad)"
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Score and issues */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold text-[12px]">{`${Math.round(animatedScore)}/100`}</span>
      </div>
    </div>
  );
};
  
  export default ScoreCircle;