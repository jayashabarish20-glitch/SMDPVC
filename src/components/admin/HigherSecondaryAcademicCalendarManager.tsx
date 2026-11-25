import { AcademicCalendarManager } from './AcademicCalendarManager';
import { CALENDAR_KEYS } from '../../hooks/useKeyedGallery';

export function HigherSecondaryAcademicCalendarManager() {
  return (
    <AcademicCalendarManager
      badge="HIGHER SECONDARY PAGE"
      title="Higher Secondary – Academic Calendar"
      description="Upload and manage the academic calendar PDF for the Higher Secondary page."
      configKey={CALENDAR_KEYS.higherSecondary}
    />
  );
}
