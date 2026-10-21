// ISO week key helper (UTC), e.g. getUtcIsoWeek(new Date('2026-10-14')) === '2026-W42'.
// Copied from scripts/m0-eval.js (M0 eval instrument) so the challenge engine
// does not depend on an eval script owned by another milestone. Week boundaries
// are computed in UTC on purpose — see proj2/docs/DB_DESIGN_M2_M3.md ("Week
// boundaries are UTC").
function getUtcIsoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

module.exports = { getUtcIsoWeek };
