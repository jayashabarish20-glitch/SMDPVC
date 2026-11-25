import { useState } from 'react';
import { ToppersManager } from './ToppersManager';

export function AchieversManager() {
  const [activeGrade, setActiveGrade] = useState<'10' | '12'>('12');

  const labels: Record<'10' | '12', string> = {
    '10': 'SSLC / Class 10 Achievers',
    '12': 'Higher Secondary / Class 12 Achievers',
  };

  return (
    <div>
      {/* Category Selector */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setActiveGrade('10')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeGrade === '10'
              ? 'bg-school-gold text-school-navy'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          SSLC / Class 10
        </button>
        <button
          onClick={() => setActiveGrade('12')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeGrade === '12'
              ? 'bg-school-gold text-school-navy'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Higher Secondary / Class 12
        </button>
      </div>

      {/* Achievers Manager Content */}
      <div>
        <h2 className="text-2xl font-bold text-school-navy mb-6">{labels[activeGrade]}</h2>
        <ToppersManager gradeLevel={activeGrade} />
      </div>
    </div>
  );
}
