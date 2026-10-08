// 効果音（効果音ラボ）とBGM（ブラウザで鳴らす自作の曲）

const STORE_SOUND = 'oyaQuiz.sound';

const Sound = (() => {
  const files = {
    question: 'assets/se/question1.mp3',
    correct: 'assets/se/correct1.mp3',
    wrong: 'assets/se/incorrect1.mp3',
    button: 'assets/se/quiz-button2.mp3',
    drum: 'assets/se/drum-roll1.mp3',
    jajean: 'assets/se/jajean1.mp3',
  };
  const se = {};
  for (const [k, src] of Object.entries(files)) {
    const a = new Audio(src);
    a.preload = 'auto';
    se[k] = a;
  }

  let on = loadJSON(STORE_SOUND, true) !== false;
  let playing = [];

  function play(name, volume = 0.8) {
    if (!on || !se[name]) return null;
    const a = se[name].cloneNode();
    a.volume = volume;
    a.play().catch(() => {});
    playing.push(a);
    a.addEventListener('ended', () => { playing = playing.filter(x => x !== a); });
    return a;
  }

  function stopAll() {
    playing.forEach(a => { a.pause(); });
    playing = [];
  }

  // ── BGM：C → Am → F → G の明るい8小節を繰り返す ──
  const BPM = 116;
  const N = { C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81, B5: 83, C6: 84, D6: 86, E6: 88,
              C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59, A2: 45, G2: 43, F2: 41 };
  // [音, 拍数]  null は休み
  const MELODY = [
    ['C5', .5], ['E5', .5], ['G5', 1], ['E5', .5], ['G5', .5], ['C6', 1],
    ['A5', 1], ['G5', .5], ['E5', .5], ['C5', 1], ['E5', 1],
    ['F5', .5], ['A5', .5], ['C6', 1], ['A5', .5], ['F5', .5], ['A5', 1],
    ['G5', 1.5], ['F5', .5], ['E5', 1], ['D5', 1],
    ['E5', .5], ['G5', .5], ['C6', 1], ['D6', .5], ['C6', .5], ['G5', 1],
    ['A5', .5], ['C6', .5], ['E6', 1], ['D6', 1], ['C6', 1],
    ['F5', 1], ['A5', 1], ['C6', 1], ['A5', 1],
    ['D6', 1], ['B5', 1], ['G5', 1.5], [null, .5],
  ];
  const CHORDS = [['C3', 'G3'], ['A2', 'E3'], ['F2', 'C3'], ['G2', 'D3'], ['C3', 'G3'], ['A2', 'E3'], ['F2', 'C3'], ['G2', 'D3']];
  const BASS = [];
  CHORDS.forEach(([root, fifth]) => { BASS.push([root, 1], [fifth, 1], [root, 1], [fifth, 1]); });

  let ctx = null, master = null, timer = null, startAt = 0, loopLen = 32 * 60 / BPM, nextLoop = 0;
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);

  function note(type, name, t, dur, vol) {
    if (!name) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq(N[name]);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur);
  }

  function scheduleLoop(t0) {
    const beat = 60 / BPM;
    let t = t0;
    MELODY.forEach(([n, b]) => { note('triangle', n, t, b * beat, 0.5); t += b * beat; });
    t = t0;
    BASS.forEach(([n, b]) => { note('sine', n, t, b * beat * 0.9, 0.6); t += b * beat; });
  }

  function bgmStart() {
    if (!on || timer) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return; }
    ctx.resume();
    master = ctx.createGain();
    master.gain.value = 0.07;
    master.connect(ctx.destination);
    nextLoop = ctx.currentTime + 0.1;
    timer = setInterval(() => {
      while (nextLoop < ctx.currentTime + 1) {
        scheduleLoop(nextLoop);
        nextLoop += loopLen;
      }
    }, 250);
  }

  function bgmStop() {
    clearInterval(timer);
    timer = null;
    if (master) {
      const m = master;
      m.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
      setTimeout(() => m.disconnect(), 600);
      master = null;
    }
  }

  // 結果発表のドラムロール中など、BGMを一時的に小さくする
  function duck(isDown) {
    if (master) master.gain.setTargetAtTime(isDown ? 0.015 : 0.07, ctx.currentTime, 0.2);
  }

  function setOn(v) {
    on = v;
    saveJSON(STORE_SOUND, v);
    if (!v) { bgmStop(); stopAll(); }
  }

  return { play, stopAll, bgmStart, bgmStop, duck, setOn, isOn: () => on };
})();
