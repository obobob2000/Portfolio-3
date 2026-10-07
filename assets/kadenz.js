
(function () {
  var root = document.getElementById('kz'); if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var phone = $('.phone'), holder = $('.kz-holder'), device = $('.kz-device'), stage = $('.kz-stage');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HASH = location.hash || '', AUTO = /auto/.test(HASH), VIDEO = /video/.test(HASH);
  if (/embed/.test(HASH) || VIDEO) document.documentElement.classList.add('kz-embed');
  if (VIDEO) document.documentElement.classList.add('kz-video');

  var S = { screen: 'heute', choice: 'z2', range: '6W', week: 40, booted: false };
  var TABS = ['heute', 'form', 'plan', 'profil'];

  /* ── Daten ── */
  var RANGES = {
    '6W': { min: 40, max: 80, fit: [57, 57, 58, 60, 61.5, 63, 64], fat: [52, 60, 55, 66, 61, 58, 78], dots: true,
            labels: [[0, 'KW 34'], [1, '35'], [2, '36'], [3, '37'], [4, '38'], [5, '39'], [6, 'Heute']] },
    '3M': { min: 40, max: 80, fit: [50, 51, 52, 53, 54, 55, 56, 57, 57, 58, 60, 62, 64], fat: [46, 55, 50, 58, 49, 62, 57, 52, 60, 55, 66, 60, 78],
            labels: [[0, 'Jul'], [4, 'Aug'], [8, 'Sep'], [12, 'Heute']] },
    '1J': { min: 20, max: 80, fit: [41, 38, 36, 37, 40, 44, 48, 51, 53, 54, 56, 60, 64], fat: [38, 30, 28, 35, 44, 50, 55, 52, 58, 54, 60, 62, 78],
            labels: [[0, 'Okt'], [3, 'Jan'], [6, 'Apr'], [9, 'Jul'], [12, 'Heute']] }
  };
  function week(n) {
    if (n === 39) return { range: '21. – 27. Sep', h: 'Woche abgeschlossen.', b: '398 von 400 TSS. Du hast dein Wochenziel so gut wie erreicht.', goal: 400, done: 398, today: 0, plan: 0,
      days: [['Mo', '21', 'Ruhetag', '', 'rest'], ['Di', '22', 'Schwelle 2×20', '1:30 h', 'done'], ['Mi', '23', 'Grundlage Z2', '1:15 h', 'done'], ['Do', '24', 'VO2max 4×4', '1:30 h', 'done'], ['Fr', '25', 'Ruhetag', '', 'rest'], ['Sa', '26', 'Lange Ausfahrt Z2', '3:15 h', 'done'], ['So', '27', 'Grundlage Z2', '1:45 h', 'done']] };
    if (n === 41) return { range: '5. – 11. Okt', h: 'Nächste Woche wird aufgebaut.', b: 'Zwei harte Einheiten und eine lange Ausfahrt. Kadenz passt den Plan an, wenn deine Bereitschaft es verlangt.', goal: 450, done: 0, today: 0, plan: 450,
      days: [['Mo', '5', 'Ruhetag', '', 'rest'], ['Di', '6', 'VO2max 5×4', '1:30 h', ''], ['Mi', '7', 'Grundlage Z2', '1:30 h', ''], ['Do', '8', 'Sweet Spot 3×15', '1:30 h', ''], ['Fr', '9', 'Ruhetag', '', 'rest'], ['Sa', '10', 'Lange Ausfahrt Z2', '4:00 h', ''], ['So', '11', 'Grundlage Z2', '2:00 h', '']] };
    var z2 = S.choice === 'z2', t = z2 ? 55 : 95;
    return { range: '28. Sep – 4. Okt', h: 'Eine Änderung diese Woche.',
      b: z2 ? 'Donnerstag wurde entschärft. Dein Wochenziel bleibt erreichbar – Samstag holt den Rest.' : 'Samstag wurde gekürzt, damit du dich nach den Intervallen erholst. Dein Wochenziel bleibt erreichbar.',
      goal: 420, done: 212, today: t, plan: 420 - 212 - t,
      days: [['Mo', '28', 'Ruhetag', '', 'rest'], ['Di', '29', 'Sweet Spot 3×12', '1:15 h', 'done'], ['Mi', '30', 'Grundlage Z2', '1:30 h', 'done'],
        z2 ? ['Do', 'Heute', 'Grundlage Z2', '1:20 h', 'now', 'Angepasst', 'statt <s>VO2max 4×4</s> · 1:30 h'] : ['Do', 'Heute', 'VO2max 4×4', '1:30 h', 'now', '', 'wie geplant · TSS 95'],
        ['Fr', '2', 'Ruhetag', '', 'rest'], z2 ? ['Sa', '3', 'Lange Ausfahrt Z2', '3:30 h', ''] : ['Sa', '3', 'Lange Ausfahrt Z2', '3:00 h', '', 'Gekürzt'], ['So', '4', 'Grundlage Z2', '2:00 h', '']] };
  }

  /* ── Templates ── */
  var ICON = {
    moon: '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"><path d="M13 9.1A5.8 5.8 0 1 1 5.9 2a4.6 4.6 0 0 0 7.1 7.1z"/></svg>',
    arrow: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12M11 5l5 5-5 5"/></svg>',
    check: '<svg width="14" height="10" viewBox="-1 -1 14 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M0 4l4 4 8-8"/></svg>',
    prev: '<svg width="8" height="14" viewBox="-1 -1 8 14" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 0L0 6l6 6"/></svg>',
    next: '<svg width="8" height="14" viewBox="-1 -1 8 14" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M0 0l6 6-6 6"/></svg>'
  };

  function tplHeute() {
    var z2 = S.choice === 'z2';
    var bars = [['Fr', 32], ['Sa', 40], ['So', 52], ['Mo', 4], ['Di', 36], ['Mi', 44]].map(function (d, j) {
      return '<div class="day"><div class="bar" style="height:' + d[1] + 'px;--j:' + j + '"></div><span class="t12">' + d[0] + '</span></div>';
    }).join('');
    var today = z2 ? '<div class="bar plan" style="height:40px;--j:6"><i style="height:24px"></i></div>' : '<div class="bar full" style="height:40px;--j:6"></div>';
    var ivl = ''; for (var i = 0; i < 9; i++) ivl += '<b style="left:' + i * 8 + 'px;height:' + (i % 2 ? 28 : 8) + 'px;opacity:' + (i % 2 ? 1 : .4) + ';--j:' + i + '"></b>';
    return '' +
      '<div class="row between rise"><span class="t16 sb">Heute</span>' +
        '<div class="row pill glass"><div class="score"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke-width="3"><circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,.12)"/><circle class="ring" cx="18" cy="18" r="15" pathLength="100" stroke-linecap="round" style="--to:32"/></svg><span data-count="68">68</span></div>' +
        '<span class="t16 md">Trainingsbereitschaft · <b class="sb acc">Mäßig</b></span></div></div>' +
      '<div class="card glass rise"><div class="row between"><span class="eyebrow">Belastung · 7 Tage</span><span class="t12">70 · Ø 52</span></div>' +
        '<div class="days">' + bars + '<div class="day now">' + today + '<span class="t12">Do</span></div></div></div>' +
      '<div class="col g8 rise"><p class="h1">' + (z2 ? 'Heute locker statt intensiv.' : 'Heute intensiv – auf eigenen Wunsch.') + '</p>' +
        '<p class="body" style="min-height:60px">' + (z2 ? 'Kurzer Schlaf trifft auf eine harte Woche. Kadenz macht aus deinen VO2max-Intervallen eine ruhige Grundlage.' : 'Du fährst VO2max wie geplant. Kadenz kürzt dafür die lange Ausfahrt am Samstag, damit du dich erholen kannst.') + '</p></div>' +
      '<div class="col g8"><p class="eyebrow rise">Warum</p>' +
        '<div class="card glass sleep rise"><div class="row between"><span class="row g8">' + ICON.moon + '<span class="t16 md">Schlaf</span></span><span class="t16 sb">5:40 h</span></div>' +
        '<div class="scale"><span class="track"></span><span class="fill"></span><span class="avg"></span><span class="knob"></span></div>' +
        '<div class="row between t12"><span>1:10 h unter Ø</span><span>Ø 6:50 h</span></div></div></div>' +
      (z2
        ? '<div class="swap rise"><div class="sc was"><span class="t10 caps">Geplant</span><span class="ttl">VO2max 4×4</span><span class="t12">1:30 h · TSS 95</span></div>' + ICON.arrow +
          '<div class="sc"><span class="t10 caps">Heute</span><span class="ttl">Grundlage Z2</span><span class="t12">1:20 h · TSS 55</span></div></div>'
        : '<div class="swap rise"><div class="sc"><span class="t10 caps">Heute · wie geplant</span><span class="ttl">VO2max 4×4</span><span class="t12">1:30 h · TSS 95</span><div class="ivl">' + ivl + '</div></div></div>') +
      '<button class="btn pri rise" type="button" data-act="start"><span class="lab">' + (z2 ? 'Z2-Einheit starten' : 'VO2max starten') + '</span></button>' +
      '<button class="link rise" type="button" data-act="' + (z2 ? 'open-sheet' : 'choose-z2') + '">' + (z2 ? 'Plan beibehalten' : 'Doch Z2 fahren') + '</button>';
  }

  function smooth(p) {
    var d = 'M' + p[0][0] + ' ' + p[0][1];
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += 'C' + r2(b[0] + (c[0] - a[0]) / 6) + ' ' + r2(b[1] + (c[1] - a[1]) / 6) + ' ' + r2(c[0] - (e[0] - b[0]) / 6) + ' ' + r2(c[1] - (e[1] - b[1]) / 6) + ' ' + c[0] + ' ' + c[1];
    }
    return d;
  }
  function r2(v) { return Math.round(v * 100) / 100; }
  function tplChart() {
    var R = RANGES[S.range], n = R.fit.length;
    var X = function (i) { return r2(12 + 264 * i / (n - 1)); }, Y = function (v) { return r2((R.max - v) / (R.max - R.min) * 160); };
    var pf = R.fit.map(function (v, i) { return [X(i), Y(v)]; }), pa = R.fat.map(function (v, i) { return [X(i), Y(v)]; });
    var line = pf.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join('');
    var dots = R.dots ? pf.slice(0, -1).map(function (p, i) { return '<circle class="pt" cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#fff" style="--f:' + r2(i / (n - 1)) + '"/>'; }).join('') : '';
    var lf = pf[n - 1], la = pa[n - 1], mid = (R.max + R.min) / 2;
    var xl = R.labels.map(function (l, k) {
      var last = k === R.labels.length - 1, st = k === 0 ? 'left:0' : last ? 'right:0' : 'left:' + X(l[0]) + 'px;transform:translateX(-50%)';
      return '<span class="' + (last ? 'on' : '') + '" style="' + st + '">' + l[1] + '</span>';
    }).join('');
    return '<div class="plotrow"><div class="plot"><span class="gl" style="top:0"></span><span class="gl" style="top:80px"></span><span class="gl" style="top:159px;background:rgba(255,255,255,.2)"></span><span class="now"></span>' +
      '<div class="reveal"><svg width="288" height="160" viewBox="0 0 288 160" fill="none"><defs><linearGradient id="kzArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + line + 'L' + lf[0] + ' 160L12 160Z" fill="url(#kzArea)"/><path d="' + smooth(pa) + '" stroke="#2fb6f0" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/><path d="' + line + '" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<svg width="288" height="160" viewBox="0 0 288 160" fill="none">' + dots +
      '<circle class="pt" cx="' + la[0] + '" cy="' + la[1] + '" r="3" fill="#080140" stroke="#2fb6f0" stroke-width="2" style="--f:1"/>' +
      '<circle class="pt" cx="' + lf[0] + '" cy="' + lf[1] + '" r="9" fill="rgba(255,255,255,.3)" style="--f:1"/><circle class="pt" cx="' + lf[0] + '" cy="' + lf[1] + '" r="5" fill="#fff" style="--f:1"/></svg></div>' +
      '<div class="axis"><span style="top:-6px">' + R.max + '</span><span style="top:74px">' + mid + '</span><span style="top:154px">' + R.min + '</span></div></div>' +
      '<div class="xl">' + xl + '</div>';
  }
  function tplForm() {
    var k = ['6W', '3M', '1J'].indexOf(S.range);
    return '' +
      '<div class="row between rise"><span class="t16 sb">Form</span><div class="ctl glass" style="--k:' + k + '" role="group" aria-label="Zeitraum"><span class="thumb"></span>' +
        [['6W', '6 W'], ['3M', '3 M'], ['1J', '1 J']].map(function (s) { return '<button class="seg" type="button" data-range="' + s[0] + '" aria-pressed="' + (S.range === s[0]) + '">' + s[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="col g8 rise"><p class="h1">Fitter als je – aber gerade müde.</p><p class="body">Fitness wächst seit 4 Wochen, die Ermüdung liegt gerade darüber.</p></div>' +
      '<div class="card tint glass rise"><div class="row" style="gap:12px"><span class="row t12" style="gap:6px"><i class="dot" style="background:#fff"></i>Fitness</span><span class="row t12" style="gap:6px"><i class="dot" style="border:2px solid #2fb6f0"></i>Ermüdung</span></div>' +
        '<div class="col" style="gap:12px" id="kz-chart">' + tplChart() + '</div></div>' +
      '<div class="card tint glass rise"><div class="row between" style="align-items:flex-start"><div class="col" style="gap:4px"><span class="t16 md">Form</span><span class="t10 caps mut">Produktiv</span></div><span class="h2" data-count="-14">−14</span></div>' +
        '<div class="col" style="gap:4px"><div class="zones"><i style="left:0"></i><i class="on" style="left:80px"></i><i style="left:160px"></i><i style="left:240px"></i><span class="halo"></span></div>' +
        '<div class="zl"><span>Über</span><span class="on">Produktiv</span><span>Neutral</span><span>Frisch</span></div></div>' +
        '<p class="body">Gut für den Aufbau. Zum Rennen in 23 Tagen solltest du bei +5 bis +15 ankommen.</p></div>' +
      '<div class="row g8 rise"><div class="card tint glass tile"><span class="t12 mut">Fitness</span><div class="row g8" style="align-items:flex-end"><span class="h2" data-count="64">64</span><span class="t12 mut" style="padding-bottom:2px">↑ 6 in 4 Wochen</span></div></div>' +
        '<div class="card tint glass tile"><span class="t12 mut">Ermüdung</span><div class="row g8" style="align-items:flex-end"><span class="h2" data-count="78">78</span><span class="t12 mut" style="padding-bottom:2px">↑ 20 in 7 Tagen</span></div></div></div>';
  }

  function tplPlan() {
    var w = week(S.week), tot = 318, segs = [], j = 0;
    var px = function (v) { return Math.round(v / w.goal * tot); };
    if (w.done) segs.push('<i style="width:' + px(w.done) + 'px;background:#fff;--j:' + j++ + '"></i>');
    if (w.today) segs.push('<i style="width:' + px(w.today) + 'px;background:var(--orange);--j:' + j++ + '"></i>');
    if (w.plan) segs.push('<i style="flex:1;background:rgba(255,255,255,.3);--j:' + j++ + '"></i>');
    var leg = function (c, l, v) { return '<span class="row t12 mut" style="gap:6px"><i class="dot" style="background:' + c + '"></i><span>' + l + ' <b class="sb" style="color:#fff">' + v + '</b></span></span>'; };
    var rows = w.days.map(function (d, i) {
      var now = d[4] === 'now', rest = d[4] === 'rest', prevNow = i > 0 && w.days[i - 1][4] === 'now';
      var badge = d[5] ? '<span class="badge">' + d[5] + '</span>' : '';
      return '<div class="dr rise' + (now ? ' now' : '') + (i === 0 || prevNow ? ' nb' : '') + '">' +
        '<div class="col date"><span class="t12 sb' + (rest ? ' mut' : '') + '">' + d[0] + '</span><span class="t10 ' + (now ? 'sb' : 'mut') + '">' + d[1] + '</span></div>' +
        '<div class="col what"><span class="row g8"><span class="t14 ' + (now ? 'sb' : rest ? 'mut' : 'md') + '">' + d[2] + '</span>' + badge + '</span>' + (d[6] ? '<span class="t12 mut">' + d[6] + '</span>' : '') + '</div>' +
        (d[3] ? '<span class="row t14 ' + (now ? 'sb' : 'mut') + '" style="gap:6px">' + (d[4] === 'done' ? ICON.check : '') + d[3] + '</span>' : '') + '</div>';
    }).join('');
    return '' +
      '<div class="row between rise"><div class="col"><span class="t16 sb">Plan</span><span class="t12 mut">' + w.range + '</span></div>' +
        '<div class="ctl glass" role="group" aria-label="Woche"><button class="step" type="button" data-week="-1" aria-label="Vorherige Woche"' + (S.week <= 39 ? ' disabled' : '') + '>' + ICON.prev + '</button><span class="kw">KW ' + S.week + '</span><button class="step" type="button" data-week="1" aria-label="Nächste Woche"' + (S.week >= 41 ? ' disabled' : '') + '>' + ICON.next + '</button></div></div>' +
      '<div class="col g8 rise"><p class="h1" style="min-height:64px">' + w.h + '</p><p class="body" style="min-height:40px">' + w.b + '</p></div>' +
      '<div class="card tint glass rise"><div class="row between"><span class="eyebrow">Wochenbelastung</span><span class="t12">' + w.done + ' / ' + w.goal + ' TSS</span></div>' +
        '<div class="load">' + segs.join('') + '</div><div class="row g16">' + (w.done ? leg('#fff', 'Erledigt', w.done) : '') + (w.today ? leg('var(--orange)', 'Heute', w.today) : '') + (w.plan ? leg('rgba(255,255,255,.3)', 'Geplant', w.plan) : '') + '</div></div>' +
      '<div class="card tint glass list rise">' + rows + '</div>';
  }
  var TPL = { heute: tplHeute, form: tplForm, plan: tplPlan };

  /* ── Motion ── */
  function count(el, delay) {
    var to = parseFloat(el.getAttribute('data-count')), fmt = function (v) { v = Math.round(v); return (v < 0 ? '−' : '') + Math.abs(v); };
    if (reduced) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    var t0 = performance.now() + delay, dur = 1000;
    (function tick() {
      var p = Math.min(1, Math.max(0, (performance.now() - t0) / dur)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e);
      if (p < 1 && el.isConnected) requestAnimationFrame(tick);
    })();
  }
  function enter(name, mode) {
    var el = $('.screen[data-screen="' + name + '"]');
    var first = mode === 'first', d0 = first ? 250 : 40, stg = first ? 95 : 45;
    el.classList.remove('is-in');
    $$('.rise', el).forEach(function (r, i) {
      r.style.setProperty('--i', i);
      $$('.bar, .ivl b, .fill, .knob, .halo, .load i, .reveal, .pt, [data-count]', r).forEach(function (c) { c.style.setProperty('--pi', i); c._pi = i; });
    });
    el.style.setProperty('--d0', d0 + 'ms'); el.style.setProperty('--stg', stg + 'ms');
    el.style.setProperty('--dur', first ? '1s' : '.7s'); el.style.setProperty('--dy', first ? '36px' : '20px');
    void el.offsetWidth;
    el.classList.add('is-in');
    $$('[data-count]', el).forEach(function (c) { count(c, d0 + (c._pi || 0) * stg + 300); });
  }
  function render(name) { $('.screen[data-screen="' + name + '"]').innerHTML = TPL[name](); }
  function show(name, mode) {
    S.screen = name;
    $$('.screen').forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-screen') === name); });
    phone.setAttribute('data-theme', name === 'heute' ? 'mid' : 'ice');
    $('.tabs').style.setProperty('--k', TABS.indexOf(name));
    $$('.tab').forEach(function (t) { t.setAttribute('aria-current', t.getAttribute('data-tab') === name ? 'page' : 'false'); });
    render(name); enter(name, mode || 'quick');
  }
  function boot() {
    S.screen = 'heute'; S.choice = 'z2'; S.range = '6W'; S.week = 40;
    phone.classList.remove('sheet-open', 'booted', 'booting');
    void phone.offsetWidth;
    phone.classList.add('booted', 'booting');
    show('heute', 'first');
    clearTimeout(boot.t); boot.t = setTimeout(function () { phone.classList.remove('booting'); }, 2600);
  }
  var toastT;
  function toast(msg) { var t = $('.toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2200); }

  /* ── Interaktion ── */
  phone.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tab],[data-act],[data-range],[data-week]'); if (!t || t.disabled) return;
    var tab = t.getAttribute('data-tab'), act = t.getAttribute('data-act');
    if (tab) { if (tab === 'profil') return toast('Profil ist im Prototyp nicht enthalten'); if (tab !== S.screen) show(tab); return; }
    if (t.hasAttribute('data-range')) {
      S.range = t.getAttribute('data-range');
      var k = ['6W', '3M', '1J'].indexOf(S.range), ctl = t.parentNode;
      ctl.style.setProperty('--k', k);
      $$('.seg', ctl).forEach(function (s) { s.setAttribute('aria-pressed', s === t); });
      var ch = $('#kz-chart'), card = ch.closest('.rise'); ch.innerHTML = tplChart();
      $$('.reveal, .pt', ch).forEach(function (c) { c.style.setProperty('--pi', 0); });
      card.parentNode.style.setProperty('--d0', '0ms');
      return;
    }
    if (t.hasAttribute('data-week')) { S.week += parseInt(t.getAttribute('data-week'), 10); render('plan'); enter('plan', 'quick'); return; }
    if (act === 'open-sheet') phone.classList.add('sheet-open');
    if (act === 'close-sheet') phone.classList.remove('sheet-open');
    if (act === 'choose-z2' || act === 'choose-vo2') {
      var next = act === 'choose-z2' ? 'z2' : 'vo2', changed = next !== S.choice;
      S.choice = next; phone.classList.remove('sheet-open');
      if (changed) setTimeout(function () { render('heute'); enter('heute', 'quick'); }, phone.classList.contains('sheet-open') ? 0 : 180);
    }
    if (act === 'start') {
      var lab = $('.lab', t); if (t._busy) return; t._busy = true; var old = lab.innerHTML;
      lab.innerHTML = ICON.check + 'Einheit gestartet';
      setTimeout(function () { if (lab.isConnected) { lab.innerHTML = old; t._busy = false; } }, 2200);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') phone.classList.remove('sheet-open'); });
  /* ── Automatischer Durchlauf ── */
  var touch = $('.touch'), demo = { on: false, timers: [] };
  var STEPS = [[2700, '[data-act="open-sheet"]'], [1500, '[data-act="choose-vo2"]'], [1800, '[data-tab="plan"]'], [1800, '[data-week="1"]'],
    [1100, '[data-tab="form"]'], [2000, '[data-range="1J"]'], [1200, '[data-tab="heute"]'], [1200, '[data-act="choose-z2"]'], [1400, '[data-act="start"]']];
  function later(fn, ms) { var t = setTimeout(fn, ms); demo.timers.push(t); return t; }
  function tap(sel, done) {
    var el = $(sel); if (!el) return done();
    var pr = phone.getBoundingClientRect(), r = el.getBoundingClientRect(), s = pr.width / 390 || 1;
    touch.style.setProperty('--x', Math.round((r.left + r.width / 2 - pr.left) / s) + 'px');
    touch.style.setProperty('--y', Math.round((r.top + r.height / 2 - pr.top) / s) + 'px');
    touch.classList.add('on');
    later(function () { touch.classList.add('down'); later(function () { touch.classList.remove('down'); el.click(); done(); }, 150); }, 620);
  }
  function stopDemo() { demo.on = false; demo.timers.forEach(clearTimeout); demo.timers = []; touch.classList.remove('on', 'down'); }
  function runDemo(loop) {
    stopDemo(); demo.on = true; window.__kzDone = false; boot();
    var i = 0;
    (function next() {
      if (!demo.on) return;
      if (i >= STEPS.length) return later(function () { touch.classList.remove('on'); later(function () { window.__kzDone = true; if (loop) runDemo(true); else stopDemo(); }, loop ? 1300 : 600); }, 1600);
      var st = STEPS[i++]; later(function () { tap(st[1], next); }, st[0]);
    })();
  }
  phone.addEventListener('pointerdown', function (e) { if (e.isTrusted && demo.on) stopDemo(); });
  var rp = document.getElementById('kz-replay'); if (rp) rp.addEventListener('click', function () { stopDemo(); boot(); });
  var au = document.getElementById('kz-auto'); if (au) au.addEventListener('click', function () { runDemo(false); });
  window.KadenzPrototyp = { replay: function () { stopDemo(); boot(); }, demo: runDemo, stop: stopDemo };
  window.addEventListener('message', function (e) { if (e.data === 'kadenz:replay') { stopDemo(); boot(); } if (e.data === 'kadenz:demo') { if (reduced) boot(); else runDemo(true); } if (e.data === 'kadenz:stop') stopDemo(); });

  /* ── Skalierung ── */
  function fit() {
    var box = stage.getBoundingClientRect();   // fractional size, so the phone fills an embedding frame exactly
    var s = Math.min(box.width / 418, box.height / 872, VIDEO ? 1.4 : 1);
    if (!(s > 0)) s = 1;
    device.style.transform = 'scale(' + s + ')';
    holder.style.width = 418 * s + 'px'; holder.style.height = 872 * s + 'px';
  }
  fit(); window.addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);

  /* ── Erstes Erscheinen ── */
  function start() { if (S.booted || VIDEO) return; S.booted = true; if (AUTO && !reduced) runDemo(true); else boot(); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); start(); } }, { threshold: .35 });
    io.observe(holder); setTimeout(start, 4000);
  } else start();
})();
