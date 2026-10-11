/* Mint Condition — game engine (pure logic, no DOM) */
var MC = (function () {
  var RAR = {
    C: { name: 'Common', w: 70, inc: 0.1, next: 'U' },
    U: { name: 'Uncommon', w: 22, inc: 0.5, next: 'R' },
    R: { name: 'Rare', w: 4, inc: 3, next: 'F' },
    F: { name: 'Foil', w: 0.25, inc: 20, next: null }
  };

  // [id, name, rarity, flavor, aware-flavor (shown once the cards start noticing you)]
  var CARDS = [
    ['pebblit', 'Pebblit', 'C', 'Mistaken for a rock 9 times out of 10. The tenth time, it bites.'],
    ['mossmouse', 'Mossmouse', 'C', 'Grows a little greener every rainy day.'],
    ['sockfox', 'Sockfox', 'C', 'Every missing sock in the world ends up in its den.', 'It has started keeping one of yours.'],
    ['drizzleby', 'Drizzleby', 'C', 'Follows hikers and rains on them, lightly, out of affection.'],
    ['crumbcrab', 'Crumbcrab', 'C', 'Lives under couches. Very well fed.'],
    ['puddlepup', 'Puddlepup', 'C', 'Will jump in any puddle. Any.'],
    ['twigling', 'Twigling', 'C', 'Pretends to be a stick when nervous, which is always.'],
    ['lintbug', 'Lintbug', 'C', 'Born in a dryer. Hates the dryer.'],
    ['snorelet', 'Snorelet', 'C', 'Sleeps 22 hours a day. Dreams of sleeping.', 'Lately it dreams about a big hand opening a pack.'],
    ['bramblet', 'Bramblet', 'C', 'Prickly on the outside. Also prickly on the inside.'],
    ['gumtoad', 'Gumdrop Toad', 'C', 'Tastes like strawberry. Please do not test this.'],
    ['fizzlefly', 'Fizzlefly', 'C', 'Glows for exactly one second before it forgets how.'],
    ['dustbun', 'Dustbunny Jr.', 'C', 'Gathers under beds. Nobody remembers inviting it.'],
    ['peaburr', 'Peaburr', 'C', 'Rolls downhill by choice and uphill by accident.'],
    ['mudsnout', 'Mudsnout', 'C', 'Digs for treasure. Has found three bottle caps.'],
    ['wobblegill', 'Wobblegill', 'C', 'A fish that never quite learned to swim straight.'],
    ['chalkmole', 'Chalkmole', 'C', 'Leaves drawings on the tunnel walls. They are getting better.', 'The newest drawing is a rectangle with a person behind it.'],
    ['nibblenut', 'Nibblenut', 'C', 'Hoards acorns, then forgets, then plants a forest.'],
    ['breezel', 'Breezel', 'C', 'A weasel made of wind. Mostly harmless. Very drafty.'],
    ['tadwick', 'Tadwick', 'C', 'A candle-tailed tadpole. Do not keep near curtains.'],
    ['lanternmoth', 'Lanternmoth', 'U', 'Guides lost travelers home, then eats their snacks.'],
    ['cobblecat', 'Cobblecat', 'U', 'Naps on old roads. Has been paved over twice.'],
    ['thistlehorn', 'Thistlehorn', 'U', 'Its horn blooms purple every spring.'],
    ['sparkbeak', 'Sparkbeak', 'U', 'Pecks power lines for fun. Lights flicker when it is happy.'],
    ['rainsnail', 'Rainsnail', 'U', 'Its shell holds a tiny, permanent thunderstorm.'],
    ['hollowowl', 'Hollowowl', 'U', 'Can turn its head all the way around. Twice.', 'It keeps turning its head toward you. Not the trainer. You.'],
    ['embernewt', 'Ember Newt', 'U', 'Warm to the touch. Good for cold pockets.'],
    ['velvetusk', 'Velvetusk', 'U', 'The softest tusks in the forest. Still tusks.'],
    ['coinbeetle', 'Coinbeetle', 'U', 'Shiny shell. Collectors chase it. It does not like collectors.', 'It knows what you are.'],
    ['shellshock', 'Shellshock', 'U', 'A turtle that zaps anything that taps its shell.'],
    ['glimmereel', 'Glimmereel', 'U', 'Glows in deep water like a dropped flashlight.'],
    ['stormmane', 'Stormmane', 'R', 'Where it gallops, the weather follows.'],
    ['vaultjaw', 'Vaultjaw', 'R', 'Swallows treasure for safekeeping. Never gives it back.'],
    ['crystalwing', 'Crystalwing', 'R', 'Each feather is a different color of light.'],
    ['moonbadger', 'Moonbadger', 'R', 'Only digs at night. Its tunnels are full of moonlight.'],
    ['ironroot', 'Ironroot', 'R', 'An ancient tree that walks once every hundred years.', 'It walked last week. Toward the edge of the card.'],
    ['tidecaller', 'Tidecaller', 'R', 'Sings, and the sea comes a little closer to listen.'],
    ['astraphel', 'Astraphel', 'F', 'Made from the light of a star that no longer exists.'],
    ['gildrake', 'Gildrake', 'F', 'A dragon of pure gold. Worth more than any hoard it guards.'],
    ['watcher', 'The Watcher', 'F', 'It has never been seen opening its eye.', 'Its eye is open now. It is looking at you.']
  ].map(function (a, i) { return { i: i, id: a[0], name: a[1], r: a[2], f: a[3], aware: a[4] || null }; });

  var BY_R = { C: [], U: [], R: [], F: [] };
  CARDS.forEach(function (c) { BY_R[c.r].push(c.i); });

  // Upgrade definitions. cost(level) = base * grow^level
  var UPS = {
    auto:    { layer: 'kid', name: 'Pack Habit', desc: 'Opens packs for you automatically.', base: 40, grow: 1, max: 1, hidden: true },
    chores:  { layer: 'kid', name: 'Extra Chores', desc: '+1.5 allowance per second.', base: 25, grow: 1.55, max: 999 },
    sleeves: { layer: 'kid', name: 'Card Sleeves', desc: '+25% card income.', base: 150, grow: 1.75, max: 999 },
    hands:   { layer: 'kid', name: 'Quick Hands', desc: 'Pack Habit opens packs 15% faster.', base: 90, grow: 1.9, max: 12, req: 'auto' },
    socks:   { layer: 'kid', name: 'Lucky Socks', desc: 'Better odds of Uncommons, Rares and Foils.', base: 300, grow: 2.4, max: 10 },
    bulk:    { layer: 'kid', name: 'Bulk Box', desc: '+1 card in every pack.', base: 900, grow: 3.2, max: 5 },
    pages:   { layer: 'binder', name: 'Page Protectors', desc: 'Each unique card gives +2% more income.', base: 6e5, grow: 2.6, max: 10 },
    swap:    { layer: 'binder', name: 'Swap Meet', desc: 'Trade-ups cost 1 fewer duplicate (min 2).', base: 1.2e6, grow: 4, max: 3 },
    slots:   { layer: 'grader', name: 'Second Mailbox', desc: '+1 grading slot.', base: 4e6, grow: 3.5, max: 5 },
    courier: { layer: 'grader', name: 'Express Courier', desc: 'Grading finishes 20% faster.', base: 3e6, grow: 2.8, max: 6 },
    steady:  { layer: 'grader', name: 'Steady Hands', desc: 'Better grade odds.', base: 8e6, grow: 3, max: 5 }
  };

  // Layer unlocks (the big purchases)
  var BINDER_COST = 2.5e6;
  var GRADER_COST = 3e7;
  var PACK_BASE = 20, PACK_GROW = 1.1;
  var OFFLINE_CAP = 4 * 3600;

  function fresh() {
    var up = {}; Object.keys(UPS).forEach(function (k) { up[k] = 0; }); up.auto = 1; 
    return {
      v: 1, coins: 20, life: 0, t: 0, packs: 0, col: {}, up: up, autoT: 0,
      autoOn: true, binder: false, grader: false, binderAt: null, graderAt: null,
      first: null, graded: [], queue: [], seen: 0, last: [], saved: Date.now()
    };
  }

  function E(state, rng) {
    this.s = state || fresh();
    this.rng = rng || Math.random;
  }
  var P = E.prototype;

  P.upCost = function (k) { var u = UPS[k]; return Math.ceil(u.base * Math.pow(u.grow, this.s.up[k])); };
  P.upAvail = function (k) {
    var u = UPS[k], s = this.s;
    if (s.up[k] >= u.max) return false;
    if (u.req && !s.up[u.req]) return false;
    if (u.layer === 'binder' && !s.binder) return false;
    if (u.layer === 'grader' && !s.grader) return false;
    return true;
  };
  P.buyUp = function (k) {
    if (!this.upAvail(k)) return false;
    var c = this.upCost(k); if (this.s.coins < c) return false;
    this.s.coins -= c; this.s.up[k]++; return true;
  };
  P.packCost = function () { return Math.ceil(PACK_BASE * Math.pow(PACK_GROW, this.s.packs)); };
  P.packSize = function () { return 5 + this.s.up.bulk; };
  P.autoInterval = function () { return 20 * Math.pow(0.85, this.s.up.hands); };

  P.uniques = function () { var n = 0; for (var i = 0; i < CARDS.length; i++) if (this.owns(i)) n++; return n; };
  P.owns = function (i) { if (this.s.col[i] > 0) return true; return this.s.graded.some(function (g) { return g.i === i; }); };
  P.pagesDone = function () {
    var self = this, out = {};
    Object.keys(BY_R).forEach(function (r) { out[r] = BY_R[r].every(function (i) { return self.owns(i); }); });
    return out;
  };

  P.gradeMult = function (g) { return Math.pow(2, g - 5); }; // 10 = 32×, 5 = 1×, 1 = 1/16×

  P.globalMult = function () {
    var s = this.s, m = 1;
    if (s.binder) {
      var u = this.uniques();
      m *= 1 + u * (0.04 + 0.02 * s.up.pages);
      var pd = this.pagesDone();
      for (var r in pd) if (pd[r]) m *= 1.5;
    }
    return m;
  };
  P.allowance = function () { return 1 + 1.5 * this.s.up.chores; };
  P.cardIncome = function () {
    var s = this.s, sum = 0;
    for (var k in s.col) sum += s.col[k] * RAR[CARDS[k].r].inc;
    if (s.first != null && this.owns(s.first)) sum += RAR[CARDS[s.first].r].inc * 4; // your first pull pulls extra weight
    for (var i = 0; i < s.graded.length; i++) { var g = s.graded[i]; sum += RAR[CARDS[g.i].r].inc * this.gradeMult(g.g); }
    return sum * (1 + 0.25 * s.up.sleeves);
  };
  P.rate = function () { return (this.allowance() + this.cardIncome()) * this.globalMult(); };

  P.rollRarity = function (lucky) {
    var L = this.s.up.socks + (lucky ? 3 : 0);
    var w = { C: RAR.C.w, U: RAR.U.w * (1 + 0.1 * L), R: RAR.R.w * (1 + 0.15 * L), F: RAR.F.w * (1 + 0.2 * L) };
    var tot = w.C + w.U + w.R + w.F, x = this.rng() * tot;
    for (var r in w) { if (x < w[r]) return r; x -= w[r]; }
    return 'C';
  };
  P.pick = function (r) { var a = BY_R[r]; return a[Math.floor(this.rng() * a.length)]; };

  P.openPack = function (manual) {
    var s = this.s, c = this.packCost();
    if (s.coins < c) return null;
    s.coins -= c; s.packs++;
    var got = [];
    for (var n = 0; n < this.packSize(); n++) {
      var r = (n === this.packSize() - 1) ? this.rollRarity(manual) : this.rollRarity(false);
      if (n === this.packSize() - 1 && r === 'C') r = this.rollRarity(manual); // last slot gets a reroll on commons
      var i = this.pick(r);
      var isNew = !this.owns(i);
      s.col[i] = (s.col[i] || 0) + 1;
      if (s.first == null) s.first = i;
      got.push({ i: i, isNew: isNew });
    }
    s.last = got;
    return got;
  };

  // Binder trade-up: N duplicates of rarity r -> 1 card of next rarity (prefers ones you're missing)
  P.tradeCost = function () { return Math.max(2, 5 - this.s.up.swap); };
  P.dupes = function (r) { var s = this.s, n = 0; BY_R[r].forEach(function (i) { if (s.col[i] > 1) n += s.col[i] - 1; }); return n; };
  P.tradeUp = function (r) {
    var s = this.s, nr = RAR[r].next, need = this.tradeCost();
    if (!s.binder || !nr || this.dupes(r) < need) return null;
    for (var k = 0; k < need; k++) {
      var best = null; BY_R[r].forEach(function (i) { if (s.col[i] > 1 && (best == null || s.col[i] > s.col[best])) best = i; });
      s.col[best]--;
    }
    var self = this, missing = BY_R[nr].filter(function (i) { return !self.owns(i); });
    var i = missing.length ? missing[Math.floor(this.rng() * missing.length)] : this.pick(nr);
    s.col[i] = (s.col[i] || 0) + 1;
    return i;
  };

  // Grading
  P.gradeSlots = function () { return 1 + this.s.up.slots; };
  P.gradeTime = function () { return 120 * Math.pow(0.8, this.s.up.courier); };
  P.gradeFee = function (i) { return Math.ceil(RAR[CARDS[i].r].inc * 2000 * Math.pow(1.15, this.s.graded.length)); };
  P.sendGrade = function (i) {
    var s = this.s;
    if (!s.grader || s.queue.length >= this.gradeSlots() || !(s.col[i] > 1)) return false;
    var fee = this.gradeFee(i); if (s.coins < fee) return false;
    s.coins -= fee; s.col[i]--;
    s.queue.push({ i: i, left: this.gradeTime(), total: this.gradeTime() });
    return true;
  };
  P.rollGrade = function () {
    // bell-ish curve around 6, Steady Hands shifts it up
    var x = 0; for (var k = 0; k < 3; k++) x += this.rng();
    var g = Math.round(2 + x * 2.6 + this.s.up.steady * 0.35);
    return Math.max(1, Math.min(10, g));
  };

  P.unlockBinder = function () { var s = this.s; if (s.binder || s.coins < BINDER_COST) return false; s.coins -= BINDER_COST; s.binder = true; s.binderAt = s.t; return true; };
  P.unlockGrader = function () { var s = this.s; if (!s.binder || s.grader || s.coins < GRADER_COST) return false; s.coins -= GRADER_COST; s.grader = true; s.graderAt = s.t; return true; };

  // Advance time by dt seconds. Returns events (finished grades).
  P.tick = function (dt) {
    var s = this.s, ev = [];
    var g = this.rate() * dt;
    s.coins += g; s.life += g; s.t += dt;
    if (s.up.auto && s.autoOn) {
      s.autoT += dt;
      var iv = this.autoInterval();
      while (s.autoT >= iv) { s.autoT -= iv; if (!this.openPack(false)) { s.autoT = 0; break; } }
    }
    for (var k = s.queue.length - 1; k >= 0; k--) {
      var q = s.queue[k]; q.left -= dt;
      if (q.left <= 0) { var gr = this.rollGrade(); s.graded.push({ i: q.i, g: gr }); s.queue.splice(k, 1); ev.push({ i: q.i, g: gr }); }
    }
    return ev;
  };

  return { E: E, fresh: fresh, CARDS: CARDS, RAR: RAR, UPS: UPS, BY_R: BY_R, BINDER_COST: BINDER_COST, GRADER_COST: GRADER_COST, OFFLINE_CAP: OFFLINE_CAP };
})();
if (typeof module !== 'undefined') module.exports = MC;
