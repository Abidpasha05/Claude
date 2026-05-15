import type { TimeSlot } from './types';

export interface SlotConfig {
  open_time: string;          // "10:00"
  close_time: string;         // "23:00"
  slot_duration_minutes: number; // e.g. 30
  prep_minutes: number;       // earliest slot = now + prep_minutes
  capacity_per_slot?: number;
}

/**
 * Generate available time slots for a given date.
 * Used for takeaway pickup / delivery arrival windows.
 */
export function generateSlots(date: Date, cfg: SlotConfig, now = new Date()): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [openH, openM] = cfg.open_time.split(':').map(Number);
  const [closeH, closeM] = cfg.close_time.split(':').map(Number);

  const dayStart = new Date(date);
  dayStart.setHours(openH, openM, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(closeH, closeM, 0, 0);

  const earliest = new Date(now.getTime() + cfg.prep_minutes * 60_000);
  const start = dayStart > earliest ? dayStart : earliest;

  let cursor = roundUpToInterval(start, cfg.slot_duration_minutes);

  while (cursor < dayEnd) {
    const end = new Date(cursor.getTime() + cfg.slot_duration_minutes * 60_000);
    if (end > dayEnd) break;
    slots.push({
      start: cursor.toISOString(),
      end: end.toISOString(),
      available: true,
      capacity_remaining: cfg.capacity_per_slot,
    });
    cursor = end;
  }

  return slots;
}

function roundUpToInterval(d: Date, minutes: number): Date {
  const ms = minutes * 60_000;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

export function formatSlot(slot: TimeSlot, locale = 'en'): string {
  const fmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fmt.format(new Date(slot.start))} – ${fmt.format(new Date(slot.end))}`;
}
