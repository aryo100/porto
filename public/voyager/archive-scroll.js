export function archiveScrollMode({ bypass, offset, delta, recordStop, journeyStop, unlocked, complete }) {
  if (bypass || offset >= journeyStop || offset + delta < recordStop) return null;
  return unlocked || complete ? 'advance' : 'hold';
}

export function archiveAdvanceTarget(position, delta, journeyEnd) {
  return Math.min(position + delta, journeyEnd);
}

export function canControlExperienceScroll(afterJourney, { bypass, archiveReleased, sceneReady }) {
  return afterJourney && (bypass || archiveReleased || sceneReady);
}
