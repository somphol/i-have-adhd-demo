/* UI wiring: builds the cards, stats strip, filters and view modes. */
(function () {
  var data = window.EXAMPLES;
  if (!data) return;

  var R = window.Render;
  var stats = R.analyze(data.examples);
  var byId = {};
  stats.forEach(function (s) { byId[s.id] = s; });

  // ---- header stats -------------------------------------------------------
  var totalBefore = stats.reduce(function (n, s) { return n + s.beforeWords; }, 0);
  var totalAfter = stats.reduce(function (n, s) { return n + s.afterWords; }, 0);
  var cut = Math.round((1 - totalAfter / totalBefore) * 100);
  var filler = stats.filter(function (s) { return s.beforeHasFiller; }).length;
  var closers = stats.filter(function (s) { return s.beforeHasCloser; }).length;

  var metrics = [
    [String(data.examples.length), 'examples'],
    [cut + '%', 'fewer words'],
    [filler + '/' + stats.length, 'open with filler'],
    [closers + '/' + stats.length, 'end with a closer']
  ];
  document.getElementById('stats').innerHTML = metrics.map(function (m) {
    return '<div class="metric"><dt>' + m[0] + '</dt><dd>' + m[1] + '</dd></div>';
  }).join('');

  // ---- cards --------------------------------------------------------------
  var main = document.getElementById('examples');
  main.innerHTML = data.examples.map(function (ex, i) {
    var s = byId[ex.id];
    return [
      '<article class="card" id="' + ex.id + '" data-kind="' + ex.kind + '">',
      '  <header class="card-head">',
      '    <span class="index">' + String(i + 1).padStart(2, '0') + '</span>',
      '    <h2>' + R.esc(ex.title) + '</h2>',
      '    <span class="kind">' + R.esc(ex.kind) + '</span>',
      '  </header>',
      '  <div class="prompt">',
      '    <span class="tag">Prompt</span>',
      '    <div class="prose">' + R.blocksToHtml(ex.prompt) + '</div>',
      '  </div>',
      '  <div class="pair">',
      pane('before', 'Without the skill', ex.before, s.beforeWords),
      pane('after', 'With the skill', ex.after, s.afterWords),
      '  </div>',
      '  <div class="why">',
      '    <h3>Why the second answer works</h3>',
      '    <ul>' + ex.why.map(function (w) { return '<li>' + R.inline(w) + '</li>'; }).join('') + '</ul>',
      '    <p class="rules">Rules applied: ' + ex.rules.map(function (r) { return '<span>' + r + '</span>'; }).join('') + '</p>',
      '  </div>',
      '</article>'
    ].join('\n');
  }).join('\n');

  function pane(kind, label, blocks, words) {
    return [
      '    <section class="pane ' + kind + '">',
      '      <div class="pane-head"><span class="dot"></span><span>' + label + '</span>' +
      '<span class="words">' + words + ' words</span></div>',
      '      <div class="prose">' + R.blocksToHtml(blocks) + '</div>',
      '    </section>'
    ].join('\n');
  }

  // ---- view mode ----------------------------------------------------------
  var viewButtons = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  function setView(mode) {
    document.body.dataset.view = mode;
    viewButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.view === mode));
    });
    try { localStorage.setItem('adhd-demo-view', mode); } catch (e) {}
  }
  viewButtons.forEach(function (b) {
    b.addEventListener('click', function () { setView(b.dataset.view); });
  });
  var saved = null;
  try { saved = localStorage.getItem('adhd-demo-view'); } catch (e) {}
  setView(saved || 'both');

  // ---- filter -------------------------------------------------------------
  var kinds = [];
  data.examples.forEach(function (ex) {
    if (kinds.indexOf(ex.kind) === -1) kinds.push(ex.kind);
  });
  var filters = document.getElementById('filters');
  filters.innerHTML = ['all'].concat(kinds).map(function (k) {
    var n = k === 'all' ? data.examples.length : data.examples.filter(function (e) { return e.kind === k; }).length;
    return '<button type="button" data-filter="' + k + '" aria-pressed="' + (k === 'all') + '">' +
      k + ' <span>' + n + '</span></button>';
  }).join('');

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-filter]');
    if (!btn) return;
    var kind = btn.dataset.filter;
    Array.prototype.forEach.call(filters.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    Array.prototype.forEach.call(document.querySelectorAll('.card'), function (card) {
      card.hidden = kind !== 'all' && card.dataset.kind !== kind;
    });
    document.getElementById('empty').hidden = kind === 'all' || !!document.querySelector('.card:not([hidden])');
  });

  // ---- keyboard -----------------------------------------------------------
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea|select)$/i.test(document.activeElement.tagName)) return;
    var map = { '1': 'both', '2': 'before', '3': 'after' };
    if (map[e.key]) { setView(map[e.key]); }
  });
})();
