import React from 'react';

interface IconProps {
  name: 'edit' | 'evaluate' | 'back' | 'logout' | 'language' | 'profile';
  className?: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, className = '', size = 24 }) => {
  const icons = {
    edit: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    evaluate: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    back: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M19 12H5M12 19l-7-7 7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path
          d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 17l5-5-5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 12H9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    language: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Левый прямоугольник (серый) с иероглифом */}
        <rect
          x="3"
          y="4"
          width="10"
          height="9"
          rx="1.5"
          fill="#E5E7EB"
          stroke="#D1D5DB"
          strokeWidth="1"
        />
        {/* Иероглиф 文 - более точное отображение */}
        <g fill="#1F2937">
          {/* Верхняя горизонтальная линия */}
          <rect x="5" y="6.5" width="6" height="0.8" rx="0.4" />
          {/* Средняя горизонтальная линия */}
          <rect x="5" y="8.5" width="6" height="0.8" rx="0.4" />
          {/* Нижняя горизонтальная линия */}
          <rect x="5" y="10.5" width="6" height="0.8" rx="0.4" />
          {/* Левая вертикальная линия */}
          <rect x="5" y="6.5" width="0.8" height="4.8" rx="0.4" />
          {/* Правая вертикальная линия */}
          <rect x="10.2" y="6.5" width="0.8" height="4.8" rx="0.4" />
        </g>
        
        {/* Правый прямоугольник (синий) с буквой A */}
        <rect
          x="11"
          y="9"
          width="10"
          height="9"
          rx="1.5"
          fill="#607CEB"
          stroke="#4F63D2"
          strokeWidth="1"
        />
        {/* Буква A - более четкая */}
        <path
          d="M14 12.5 L15.5 15.5 L17 12.5 M15.5 15.5 L15.5 16.5"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Пунктирная диагональная линия */}
        <line
          x1="3"
          y1="4"
          x2="21"
          y2="18"
          stroke="#9CA3AF"
          strokeWidth="1"
          strokeDasharray="2 2"
          strokeLinecap="round"
        />
        
        {/* Стрелка вправо (слева) */}
        <path
          d="M2 8 L3.5 8.5 L2 9"
          fill="#1F2937"
          stroke="#1F2937"
          strokeWidth="0.5"
        />
        
        {/* Стрелка влево (справа) */}
        <path
          d="M22 14 L20.5 14.5 L22 15"
          fill="#1F2937"
          stroke="#1F2937"
          strokeWidth="0.5"
        />
      </svg>
    ),
    profile: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Голова */}
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Тело */}
        <path
          d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    ),
  };

  return icons[name];
};

export default Icon;
