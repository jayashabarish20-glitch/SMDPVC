import { AcademicCalendarManager } from './AcademicCalendarManager';
import { CALENDAR_KEYS } from '../../hooks/useKeyedGallery';

export function PrimaryAcademicCalendarManager() {
  return (
    <AcademicCalendarManager
      badge="PRIMARY PAGE"
      title="Primary – Academic Calendar"
      description="Upload and manage the academic calendar PDF for the Primary page."
      configKey={CALENDAR_KEYS.primary}
    />
  );
}
