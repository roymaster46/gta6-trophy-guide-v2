/* Leonida Platinum — offline tracker for the 55 GTA 6 trophies.
   Loads its own data file only (data/trophies.json). No network, no cookies. */
(function () {
  'use strict';

  var DATA_URL = 'data/trophies.json';
  var STORE_KEY = 'gta6-leonida-platinum-v1';
  var GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
  var DEMO_EARNED = [2, 3, 8, 15, 16, 20, 21, 33, 35, 42, 46, 53, 55];
  var DEMO_COUNTS = { 15: 250, 17: 12, 18: 5, 28: 6, 31: 41, 32: 23, 35: 100 };

  var guideData = null;
  var trophies = [];
  var sources = [];
  var state = { earned: {}, counts: {}, spoiler: false, filter: 'all', query: '', tab: 'tracker', selected: 28 };
  var els = {};

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function sourceByNumber(n) {
    for (var i = 0; i < sources.length; i++) if (sources[i].n === n) return sources[i];
    return null;
  }

  function citeLinks(text) {
    return esc(text).replace(/\[(\d+)\]/g, function (m, n) {
      var s = sourceByNumber(Number(n));
      if (s && s.url) return '<a class="cite" href="' + esc(s.url) + '" target="_blank" rel="noopener">[' + n + ']</a>';
      return '<span class="cite">[' + n + ']</span>';
    });
  }

  function citeSpans(nums) {
    return nums.map(function (n) {
      var s = sourceByNumber(n);
      if (s && s.url) return '<a class="cite" href="' + esc(s.url) + '" target="_blank" rel="noopener">[' + n + ']</a>';
      return '<span class="cite">[' + n + ']</span>';
    }).join(' ');
  }

  function isEarned(t) { return !!state.earned[t.id]; }
  function isSpoiled(t) { return state.spoiler && t.kind === 'story' && !isEarned(t); }
  function gradePoints(t) { return GRADE_POINTS[t.grade] || 0; }

  function psnPoints() {
    var total = 0;
    trophies.forEach(function (t) { if (isEarned(t)) total += gradePoints(t); });
    return total;
  }

  function loadSavedProgress() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      if (saved && typeof saved === 'object') {
        state.earned = saved.earned || {};
        state.counts = saved.counts || {};
        state.spoiler = !!saved.spoiler;
        return true;
      }
    } catch (e) { /* corrupted save: start fresh */ }
    return false;
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        earned: state.earned, counts: state.counts, spoiler: state.spoiler, savedAt: new Date().toISOString()
      }));
      var note = document.getElementById('saveNote');
      if (note) note.textContent = 'Saved in this browser';
    } catch (e) { /* storage unavailable: tracker still works in memory */ }
  }

  function applyDemoSeed() {
    if (loadSavedProgress()) return;
    DEMO_EARNED.forEach(function (id) { state.earned[id] = true; });
    Object.keys(DEMO_COUNTS).forEach(function (id) { state.counts[id] = DEMO_COUNTS[id]; });
    var note = document.getElementById('saveNote');
    if (note) note.textContent = 'Demo progress shown — tick a box to start your own save';
  }

  function trophyMatchesFilter(t) {
    var f = state.filter;
    if (f === 'all') return true;
    if (f === 'story') return t.kind === 'story';
    if (f === 'missable') return !!t.missable;
    if (f === 'collectibles') return t.kind === 'collectibles';
    if (f === 'activities') return t.kind === 'activities';
    if (f === 'online') return false;
    if (f === 'hidden') return !!t.hidden;
    if (f === 'disputed') return !!t.dispute;
    if (f === 'notearned') return !isEarned(t);
    return true;
  }

  function trophyMatchesQuery(t) {
    if (!state.query) return true;
    var q = state.query.toLowerCase();
    return t.name.toLowerCase().indexOf(q) !== -1 || t.description.toLowerCase().indexOf(q) !== -1;
  }

  function updateProgressHeader() {
    var earned = trophies.filter(isEarned);
    var total = trophies.length || 55;
    var pct = Math.round(earned.length / total * 100);
    document.getElementById('earnedCount').textContent = earned.length + '/' + total + ' earned';
    document.getElementById('pointsLine').textContent = psnPoints() + ' / 1,350 PSN points';
    var grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    earned.forEach(function (t) { grades[t.grade]++; });
    document.getElementById('gradeLine').textContent =
      grades.platinum + 'P · ' + grades.gold + 'G · ' + grades.silver + 'S · ' + grades.bronze + 'B';
    document.getElementById('progressFill').style.width = pct + '%';
    var s1 = trophies.filter(function (t) { return t.stage === 1 && isEarned(t); }).length;
    var s1total = trophies.filter(function (t) { return t.stage === 1; }).length;
    document.getElementById('stageLine').textContent = 'Stage 1: story — ' + s1 + '/' + s1total + ' done';
    document.getElementById('footStats').textContent =
      earned.length + ' of ' + total + ' earned · ' + psnPoints() + ' PSN points · ' +
      trophies.filter(function (t) { return t.missable; }).length + ' possibly missable';
  }

  function riskFlag(t) {
    if (t.missable) return '<span class="flag miss">MISSABLE</span>';
    if (t.risk === 'at-risk') return '<span class="flag risk">AT RISK</span>';
    if (t.risk === 'unconfirmed') return '<span class="flag unconf">UNCONFIRMED</span>';
    return '';
  }

  function renderChecklist() {
    var list = document.getElementById('trophyList');
    var shown = trophies.filter(function (t) { return trophyMatchesFilter(t) && trophyMatchesQuery(t); });
    document.getElementById('filterCount').textContent = shown.length + ' of 55 shown';
    var html = '';
    shown.forEach(function (t) {
      var spoiled = isSpoiled(t);
      var name = spoiled ? 'Hidden trophy — earn it to reveal' : esc(t.name);
      var desc = spoiled ? 'Story trophy. Its name and description stay hidden until earned.' : esc(t.description);
      html += '<li class="trophy-row' + (isEarned(t) ? ' earned' : '') + (state.selected === t.id ? ' selected' : '') +
        '" data-id="' + t.id + '" tabindex="0">' +
        '<input type="checkbox" data-check="' + t.id + '"' + (isEarned(t) ? ' checked' : '') +
        ' aria-label="Mark ' + esc(t.name) + ' earned">' +
        '<span><span class="trophy-name">' + name + '</span>' + riskFlag(t) +
        (t.hidden ? ' <span class="flag hidden">PSN-HIDDEN</span>' : '') +
        '<br><span class="trophy-desc">' + desc + '</span></span>' +
        '<span class="grade ' + t.grade + '">' + t.grade + '</span></li>';
    });
    list.innerHTML = html || '<li class="trophy-row">No trophies match this filter.</li>';
  }

  function renderDetail() {
    var pane = document.getElementById('detailPane');
    var t = null;
    trophies.forEach(function (x) { if (x.id === state.selected) t = x; });
    if (!t) { pane.innerHTML = '<p>Pick a trophy from the checklist to open its guide.</p>'; return; }
    var spoiled = isSpoiled(t);
    var html = '<div class="detail-head"><h2>' + (spoiled ? 'Hidden story trophy' : esc(t.name)) + '</h2>' +
      '<span class="grade ' + t.grade + '">' + t.grade + '</span></div>';
    html += '<div class="detail-quote">&ldquo;' + (spoiled ? 'Hidden until earned.' : esc(t.description)) + '&rdquo;</div>';
    html += '<div class="detail-meta"><span>Grade: <b>' + t.grade + '</b> · <b>' + gradePoints(t) + ' PSN pts</b></span>' +
      '<span>Kind: <b>' + esc(t.kind) + '</b></span>' +
      '<span>Roadmap stage: <b>' + t.stage + ' of 3</b></span>' +
      '<span>' + (t.hidden ? 'PSN-hidden' : 'Visible on PSN') + '</span>' +
      '<span>Sources: <b>' + t.sources.map(function (n) { return '[' + n + ']'; }).join(' ') + '</b></span></div>';
    if (spoiled) {
      html += '<div class="callout unconfirmed"><b>Spoiler shield is on.</b> This story trophy stays hidden until you earn it. ' +
        'Turn the shield off (top right) to read its guide, or tick it earned in the checklist to reveal it.</div>';
    } else {
      if (t.window) html += '<div class="callout missable"><b>Missable window — read first.</b>' + esc(t.window) + '</div>';
      if (t.dispute) html += '<div class="callout dispute"><b>Sources differ — both versions shown.</b><br>A: ' +
        citeLinks(t.dispute.a) + '<br>B: ' + citeLinks(t.dispute.b) + '</div>';
      html += '<h3>How to earn it — ' + t.steps.length + ' steps</h3><ol class="steps">';
      t.steps.forEach(function (s) { html += '<li>' + citeLinks(s.t) + ' ' + citeSpans(s.s) + '</li>'; });
      html += '</ol>';
      html += '<p>' + citeLinks(t.guide) + '</p>';
      if (t.count) {
        var cur = state.counts[t.id] || 0;
        var done = cur >= t.count;
        html += '<div class="counter-box"><span class="count-big">' + cur + ' / ' + t.count.toLocaleString() + '</span>' +
          '<span>' + esc(t.countLabel || 'counted') + '</span>' +
          '<button type="button" data-count="-1" data-id="' + t.id + '">−1</button>' +
          '<button type="button" data-count="1" data-id="' + t.id + '">+1</button>' +
          '<button type="button" data-count="10" data-id="' + t.id + '">+10</button>' +
          '<input type="number" min="0" max="' + t.count + '" value="' + cur + '" data-countinput="' + t.id + '" aria-label="Your count">' +
          (done ? '<b>Target reached — mark it earned below.</b>' : '') + '</div>';
      }
      if (t.risk === 'unconfirmed') html += '<div class="callout unconfirmed"><b>Unconfirmed.</b> No two sources agree on the exact trigger yet. ' +
        'This guide says what is reported and labels it — it does not guess.</div>';
    }
    html += '<button type="button" class="earn-btn' + (isEarned(t) ? ' earned' : '') + '" data-earn="' + t.id + '">' +
      (isEarned(t) ? '✓ Earned — click to undo' : 'Mark as earned') + '</button>';
    html += '<div class="detail-sources">Sources for this trophy: ' + t.sources.map(function (n) {
      var s = sourceByNumber(n);
      return s ? (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">[' + n + '] ' + esc(s.name) + '</a>' : '[' + n + '] ' + esc(s.name)) : '[' + n + ']';
    }).join(' · ') + ' — read 20 Nov 2026. Guides are our own words; sources are cited, never copied.</div>';
    pane.innerHTML = html;
  }

  function roadmapOrder() {
    return trophies.slice().sort(function (a, b) {
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.id - b.id;
    });
  }

  function renderNextUp() {
    var next = roadmapOrder().filter(function (t) { return !isEarned(t); }).slice(0, 8);
    var html = next.map(function (t) {
      return '<li>' + esc(t.name) + ' <span class="grade ' + t.grade + '">' + t.grade + '</span>' +
        (t.missable ? ' <span class="flag miss">MISSABLE</span>' : '') + '</li>';
    }).join('');
    document.getElementById('nextUp').innerHTML = html || '<li>All 55 earned — platinum is yours.</li>';
  }

  function renderSources() {
    var counts = {};
    trophies.forEach(function (t) { t.sources.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; }); });
    var html = sources.map(function (s) {
      var name = s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name);
      return '<li><b>[' + s.n + ']</b> ' + name + '<span class="src-claims">' + esc(s.note) + ' · cited by ' +
        (counts[s.n] || 0) + ' of 55 guides · read 20 Nov 2026</span></li>';
    }).join('');
    document.getElementById('sourceList').innerHTML = html;
  }

  function renderRoadmap() {
    var stages = [
      { n: 1, title: 'Stage 1 — Story & first pass (60–80 hours)', meta: 'Chapters 1–5, all story trophies, plus the one missable meditation. Scan vehicles and study animals as you go.' },
      { n: 2, title: 'Stage 2 — 100% completion (about 100 hours)', meta: 'The checklist under Progress, then Stats, after the story. Robberies, collectibles, races, ranges, challenges.' },
      { n: 3, title: 'Stage 3 — Strangers & cleanup (10–20 hours)', meta: 'Stranger strands, partner trophies, money and property, then the platinum.' }
    ];
    var html = '';
    stages.forEach(function (st) {
      var items = trophies.filter(function (t) { return t.stage === st.n; });
      var done = items.filter(isEarned).length;
      html += '<div class="stage-card"><h3>' + st.title + '</h3><div class="stage-meta">' + st.meta +
        ' — ' + done + '/' + items.length + ' earned</div><ol>';
      items.forEach(function (t) {
        html += '<li class="' + (isEarned(t) ? 'done' : '') + '" data-open="' + t.id + '">' + esc(t.name) +
          ' <span class="grade ' + t.grade + '">' + t.grade + '</span>' + riskFlag(t) + '</li>';
      });
      html += '</ol></div>';
    });
    document.getElementById('roadmapStages').innerHTML = html;
  }

  function renderMissables() {
    var groups = [
      { title: 'Possibly missable (1)', list: trophies.filter(function (t) { return t.risk === 'missable'; }) },
      { title: 'At risk — story-progress windows reported (5)', list: trophies.filter(function (t) { return t.risk === 'at-risk'; }) },
      { title: 'Unconfirmed — trigger not yet agreed by two sources (7)', list: trophies.filter(function (t) { return t.risk === 'unconfirmed'; }) }
    ];
    var html = '';
    groups.forEach(function (g) {
      g.list.forEach(function (t) {
        html += '<div class="miss-card"><h3>' + esc(t.name) + ' <span class="grade ' + t.grade + '">' + t.grade + '</span>' +
          riskFlag(t) + '</h3><p>' + esc(t.description) + '</p>' +
          (t.window ? '<p><b>Window:</b> ' + esc(t.window) + '</p>' : '') +
          '<p>' + citeLinks(t.guide) + '</p>' +
          '<p><button type="button" class="chip" data-open="' + t.id + '">Open full guide</button></p></div>';
      });
    });
    html += '<div class="miss-card"><h3>Everything else: safe</h3><p>42 trophies carry no missable, at-risk or unconfirmed flag. ' +
      'After the story, free-roam stays open and the 100% checklist appears, so the whole rest of the list can be cleaned up at your own pace [1][3].</p></div>';
    document.getElementById('missableList').innerHTML = html;
  }

  function renderSourceMatrix() {
    var counts = {};
    trophies.forEach(function (t) { t.sources.forEach(function (n) { counts[n] = (counts[n] || 0) + 1; }); });
    var html = sources.map(function (s) {
      var citing = trophies.filter(function (t) { return t.sources.indexOf(s.n) !== -1; }).slice(0, 12);
      var name = s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name);
      return '<div class="source-card"><h3>[' + s.n + '] ' + name + '</h3><p>' + esc(s.note) + '</p>' +
        '<p>Cited by <b>' + (counts[s.n] || 0) + ' of 55</b> guides · read 20 Nov 2026</p>' +
        '<p class="trophy-refs">Guides citing it: ' + citing.map(function (t) { return esc(t.name); }).join(', ') +
        (counts[s.n] > 12 ? '…' : '') + '</p></div>';
    }).join('');
    document.getElementById('sourceMatrix').innerHTML = html;
  }

  function renderAll() {
    updateProgressHeader();
    renderChecklist();
    renderDetail();
    renderNextUp();
    renderSources();
    renderRoadmap();
    renderMissables();
    renderSourceMatrix();
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
    ['tracker', 'roadmap', 'missables', 'sources'].forEach(function (v) {
      document.getElementById('view-' + v).hidden = (v !== tab);
    });
    if (history.replaceState) history.replaceState(null, '', '#' + tab);
  }

  function setSpoiler(on) {
    state.spoiler = on;
    var btn = document.getElementById('spoilerBtn');
    btn.textContent = 'Spoiler shield: ' + (on ? 'ON' : 'OFF');
    btn.setAttribute('aria-pressed', String(on));
    saveProgress();
    renderChecklist();
    renderDetail();
  }

  function toggleEarned(id) {
    if (state.earned[id]) delete state.earned[id]; else state.earned[id] = true;
    saveProgress();
    renderAll();
  }

  function exportProgress() {
    var blob = new Blob([JSON.stringify({ app: 'leonida-platinum', earned: state.earned, counts: state.counts, spoiler: state.spoiler }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object' || !data.earned) throw new Error('bad file');
        state.earned = data.earned;
        state.counts = data.counts || {};
        if (typeof data.spoiler === 'boolean') state.spoiler = data.spoiler;
        saveProgress();
        renderAll();
      } catch (e) {
        alert('That file is not a Leonida Platinum progress export.');
      }
    };
    reader.readAsText(file);
  }

  function loadGuideData() {
    return fetch(DATA_URL).then(function (r) {
      if (!r.ok) throw new Error('data failed to load');
      return r.json();
    }).then(function (data) {
      guideData = data;
      trophies = data.trophies || [];
      sources = data.sources || [];
    });
  }

  function bindEvents() {
    document.getElementById('trophyList').addEventListener('click', function (e) {
      var check = e.target.closest('[data-check]');
      if (check) { toggleEarned(Number(check.dataset.check)); return; }
      var row = e.target.closest('.trophy-row');
      if (row && row.dataset.id) { state.selected = Number(row.dataset.id); renderChecklist(); renderDetail(); }
    });
    document.getElementById('trophyList').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var row = e.target.closest('.trophy-row');
        if (row && row.dataset.id) { state.selected = Number(row.dataset.id); renderChecklist(); renderDetail(); }
      }
    });
    document.getElementById('detailPane').addEventListener('click', function (e) {
      var earn = e.target.closest('[data-earn]');
      if (earn) { toggleEarned(Number(earn.dataset.earn)); return; }
      var c = e.target.closest('[data-count]');
      if (c) {
        var id = Number(c.dataset.id);
        var cur = state.counts[id] || 0;
        state.counts[id] = Math.max(0, cur + Number(c.dataset.count));
        saveProgress(); renderDetail(); updateProgressHeader();
      }
    });
    document.getElementById('detailPane').addEventListener('change', function (e) {
      var input = e.target.closest('[data-countinput]');
      if (input) {
        var id = Number(input.dataset.countinput);
        state.counts[id] = Math.max(0, Number(input.value) || 0);
        saveProgress(); renderDetail(); updateProgressHeader();
      }
    });
    document.querySelectorAll('.chip[data-filter]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.chip[data-filter]').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        state.filter = chip.dataset.filter;
        renderChecklist();
      });
    });
    document.getElementById('searchBox').addEventListener('input', function (e) {
      state.query = e.target.value.trim();
      renderChecklist();
    });
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () { setTab(tab.dataset.tab); });
    });
    document.getElementById('spoilerBtn').addEventListener('click', function () { setSpoiler(!state.spoiler); });
    document.getElementById('exportBtn').addEventListener('click', exportProgress);
    document.getElementById('importBtn').addEventListener('click', function () { document.getElementById('importFile').click(); });
    document.getElementById('importFile').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
      e.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', function () {
      if (confirm('Clear all earned trophies and counts?')) {
        state.earned = {}; state.counts = {};
        saveProgress(); renderAll();
      }
    });
    document.addEventListener('click', function (e) {
      var open = e.target.closest('[data-open]');
      if (open) { state.selected = Number(open.dataset.open); setTab('tracker'); renderAll(); }
    });
  }

  function boot() {
    var params = new URLSearchParams(location.search);
    var hash = (location.hash || '').replace(/^#\/?/, '');
    if (['tracker', 'roadmap', 'missables', 'sources'].indexOf(hash) !== -1) state.tab = hash;
    if (params.get('demo') === '1') applyDemoSeed(); else loadSavedProgress();
    loadGuideData().then(function () {
      var savedSpoiler = state.spoiler;
      setSpoiler(savedSpoiler);
      bindEvents();
      setTab(state.tab);
      renderAll();
    }).catch(function () {
      document.getElementById('detailPane').innerHTML =
        '<p>Could not load the trophy data. Open this guide from its own folder with a static server (for example, node serve.ts) — the data file loads from the same folder.</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
