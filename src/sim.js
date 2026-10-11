// Pacing simulation: how long until Binder and Grader for different play styles
const MC = require('./engine.js');
function seeded(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
const kidUps = ['auto', 'chores', 'sleeves', 'hands', 'socks', 'bulk'];

function run(profile, seed) {
  const g = new MC.E(null, seeded(seed)); const s = g.s;
  const check = profile.check; // seconds between check-ins
  let out = {};
  const marks = [600, 1800, 3600, 5400, 7200];
  for (let t = 0; t < 4 * 3600; t++) {
    g.tick(1);
    if (profile.rip && s.autoOn && t % profile.rip === 0) g.openPack(true);
    if (t % check === 0) {
      if (!s.binder) { if (!profile.nob && g.unlockBinder()) s.autoOn = true; }
      else if (!s.grader) { if (g.unlockGrader()) s.autoOn = true; }
      if (s.binder) ['C', 'U', 'R'].forEach(r => { while (g.tradeUp(r) != null); });
      if (s.grader) { MC.CARDS.forEach(c => { if (s.col[c.i] > 1 && c.r !== 'C') g.sendGrade(c.i); }); }
      // buy cheapest available upgrade repeatedly, but save up if a layer unlock is within reach
      const goal = profile.nob ? Infinity : !s.binder ? MC.BINDER_COST : (!s.grader ? MC.GRADER_COST : Infinity);
      for (let n = 0; n < 50; n++) {
        const pool = Object.keys(MC.UPS).filter(k => g.upAvail(k)).map(k => [k, g.upCost(k)]).sort((a, b) => a[1] - b[1]);
        if (!pool.length || pool[0][1] > s.coins) break;
        if (g.rate() * 3600 >= goal) { s.autoOn = false; break; } // goal in sight: save up
        s.autoOn = true;
        g.buyUp(pool[0][0]);
      }
    }
    if (marks.includes(t)) out[t / 60 + 'm'] = g.rate().toExponential(1) + '/s life ' + s.life.toExponential(1) + ' p' + s.packs + ' u' + g.uniques();
    if (s.binder && !out.binder) out.binder = (t / 60).toFixed(0) + 'm';
    if (s.grader && !out.grader) out.grader = (t / 60).toFixed(0) + 'm';
  }
  out.packs = s.packs; out.uniq = g.uniques(); out.graded = s.graded.length;
  out.ups = kidUps.map(k => k + s.up[k]).join(' ');
  return out;
}
const profiles = process.argv[2]==='nob' ? {active:{check:15,rip:3,nob:1},normal:{check:120,rip:0,nob:1},idle:{check:900,rip:0,nob:1}} : {
  active: { check: 15, rip: 3 },
  normal: { check: 120, rip: 0 },
  idle: { check: 900, rip: 0 }
};
for (const [n, p] of Object.entries(profiles)) for (const seed of [1, 7, 42]) console.log(n, seed, JSON.stringify(run(p, seed)));
