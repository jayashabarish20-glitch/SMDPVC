import { AcademicCalendarManager } from './AcademicCalendarManager';
import { CALENDAR_KEYS } from '../../hooks/useKeyedGallery';

export function NurseryAcademicCalendarManager() {
  return (
    <AcademicCalendarManager
      badge="NURSERY PAGE"
      title="Nursery – Academic Calendar"
      description="Upload and manage the academic calendar PDF for the Nursery page."
      configKey={CALENDAR_KEYS.nursery}
    />
  );
}
