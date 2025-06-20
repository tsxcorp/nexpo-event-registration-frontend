import { FC } from 'react';

interface ProgressBarProps {
  value: number; // Current value
  max?: number;  // Maximum value (defaults to 100)
  label?: string;
}

const ProgressBar: FC<ProgressBarProps> = ({ value, max = 100, label }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar; 