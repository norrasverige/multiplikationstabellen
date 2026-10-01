import { createIcons, ArrowRight, ArrowLeft, Check, CheckCheck, Clock3, Flag, RotateCcw, Settings2, Sparkles, Target, Trophy, Volume2, VolumeX, X } from 'lucide';
import { startSession, remainingSeconds, submitAnswer, finishSession } from './practice.js';
import './style.css';

const app = document.querySelector('#app');
const icons = { ArrowRight, ArrowLeft, Check, CheckCheck, Clock3, Flag, RotateCcw, Settings2, Sparkles, Target, Trophy, Volume2, VolumeX, X };
const settings = { left: [1, 2, 3, 4], right: [3, 4, 5], count: 20, minutes: 2, seconds: 0 };
let session = null;
let interval = null;
let soundOn = true;
let audio = null;
let streak = 0;

const icon = name => `<i data-lucide="${name}"></i>`;
const timeLabel = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const refreshIcons = () => createIcons({ icons, attrs: { 'aria-hidden': 'true', 'stroke-width': 1.8 } });

function sound(kind) {
  if (!soundOn) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const notes = kind === 'complete'
      ? [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51]
      : kind === 'timeout' ? [659.25, 523.25, 392]
        : kind === 'correct' ? [659.25, 880] : [392, 440];
    const spacing = kind === 'complete' ? 0.14 : kind === 'timeout' ? 0.24 : 0.11;
    const duration = kind === 'complete' ? 0.4 : kind === 'timeout' ? 0.35 : 0.25;
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + index * spacing;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.02);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    });
  } catch {}
}

function shell(content, active = 'setup') {
  app.innerHTML = `
    <header class="header">
      <a class="brand" href="/" aria-label="Times Club home"><span class="brand-mark" aria-hidden="true">&times;</span>Times Club<span class="brand-dot">.</span></a>
      <div class="header-right"><span class="header-caption">A little practice. A lot of progress.</span><button class="icon-button" id="sound-toggle" title="${soundOn ? 'Mute sounds' : 'Enable sounds'}" aria-label="${soundOn ? 'Mute sounds' : 'Enable sounds'}" aria-pressed="${soundOn}">${icon(soundOn ? 'volume-2' : 'volume-x')}</button></div>
    </header>
    <main>
      <nav class="steps" aria-label="Practice stages">
        ${[['setup', '01', 'Make it yours'], ['practice', '02', 'Practice'], ['results', '03', 'Your results']].map(([key, number, label]) => `<span class="step ${active === key ? 'active' : ''}" ${active === key ? 'aria-current="step"' : ''}><span class="step-number">${number}</span>${label}</span>`).join('<span class="step-line"></span>')}
      </nav>
      ${content}
    </main>
    <footer><span>Small steps, big discoveries.</span><span>Made for curious minds ${icon('sparkles')}</span></footer>`;
  refreshIcons();
  document.querySelector('#sound-toggle').addEventListener('click', event => {
    soundOn = !soundOn;
    const button = event.currentTarget;
    button.innerHTML = icon(soundOn ? 'volume-2' : 'volume-x');
    button.title = button.ariaLabel = soundOn ? 'Mute sounds' : 'Enable sounds';
    button.setAttribute('aria-pressed', String(soundOn));
    refreshIcons();
    if (soundOn) sound('correct');
  });
  document.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    if (session && session.endedAt === null) {
      if (!window.confirm('Leave this practice session?')) return;
      finishSession(session, 'stopped');
    }
    clearInterval(interval);
    showSetup();
  });
}

function numberPool(side, label, subtitle) {
  return `<fieldset class="number-pool"><legend><span class="pool-badge ${side}">${side === 'left' ? 'A' : 'B'}</span>${label}</legend><p>${subtitle}</p>
    <div class="number-grid">${Array.from({ length: 12 }, (_, index) => index + 1).map(number => `<label class="number-choice ${side}"><input type="checkbox" name="${side}" value="${number}" ${settings[side].includes(number) ? 'checked' : ''}><span>${number}</span></label>`).join('')}</div>
    <div class="pool-actions"><button type="button" data-pool="${side}" data-action="all">Select all</button><button type="button" data-pool="${side}" data-action="clear">Clear</button><span id="${side}-count"></span></div>
  </fieldset>`;
}

function showSetup() {
  session = null;
  shell(`<div class="page-heading"><div><span class="eyebrow">READY, SET, MULTIPLY</span><h1>Your next little challenge.</h1><p>Pick your numbers and make today a personal best.</p></div><div class="heading-art" aria-hidden="true"><span class="art-square">3</span><span class="art-times">&times;</span><span class="art-circle">4</span><span class="art-spark">+</span></div></div>
    <form id="setup-form" novalidate>
      <div class="setup-layout">
        <section class="tables-section" aria-labelledby="tables-title"><div class="section-heading"><span class="section-icon mint">${icon('target')}</span><div><h2 id="tables-title">Choose your numbers</h2><p>Two sets. One multiplication adventure.</p></div></div>
          <div class="pools">${numberPool('left', 'First number', 'Which numbers go on the left?')}<span class="pool-multiply" aria-hidden="true">&times;</span>${numberPool('right', 'Second number', 'Which numbers go on the right?')}</div>
          <div class="combination-preview"><span class="preview-label">YOUR MIX</span><div id="examples"></div><span id="combinations"></span></div>
        </section>
        <section class="session-settings" aria-labelledby="settings-title"><div class="section-heading"><span class="section-icon peach">${icon('settings-2')}</span><div><h2 id="settings-title">Set your pace</h2><p>A challenge that fits you.</p></div></div>
          <label class="field-label" for="question-count">Number of questions</label><div class="count-input">${icon('check-check')}<input id="question-count" type="number" min="1" max="200" value="${settings.count}" required><span>questions</span></div>
          <div class="presets" aria-label="Question count presets">${[10, 20, 30].map(count => `<button type="button" data-count="${count}" aria-pressed="${settings.count === count}" class="${settings.count === count ? 'selected' : ''}">${count}</button>`).join('')}</div>
          <label class="field-label" for="minutes">Practice time</label><div class="time-inputs"><div><input id="minutes" aria-label="Minutes" type="number" min="0" max="60" value="${settings.minutes}" required><span>min</span></div><span class="time-colon">:</span><div><input id="seconds" aria-label="Seconds" type="number" min="0" max="59" value="${settings.seconds}" required><span>sec</span></div></div>
          <div class="timer-note">${icon('clock-3')}<span id="timer-summary"></span></div>
        </section>
      </div>
      <div class="start-row"><div class="start-note"><span class="tiny-star">${icon('sparkles')}</span><span>A fresh mix every time.<br><strong>You&#39;ve got this.</strong></span></div><button class="primary-button" type="submit">Let&#39;s practice ${icon('arrow-right')}</button></div>
      <p id="setup-error" class="error" role="alert"></p>
    </form>`);

  const form = document.querySelector('#setup-form');
  const update = () => {
    for (const side of ['left', 'right']) {
      settings[side] = [...form.querySelectorAll(`input[name="${side}"]:checked`)].map(input => Number(input.value));
      document.querySelector(`#${side}-count`).textContent = `${settings[side].length} selected`;
    }
    const examples = settings.left.flatMap(first => settings.right.map(second => `${first} &times; ${second}`));
    document.querySelector('#examples').innerHTML = examples.slice(0, 3).map(text => `<span>${text}</span>`).join('') + (examples.length > 3 ? '<span class="more-mixes">...</span>' : '');
    document.querySelector('#combinations').textContent = `${examples.length} combinations`;
    settings.count = Number(document.querySelector('#question-count').value);
    settings.minutes = Number(document.querySelector('#minutes').value);
    settings.seconds = Number(document.querySelector('#seconds').value);
    for (const button of form.querySelectorAll('[data-count]')) {
      const selected = Number(button.dataset.count) === settings.count;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    document.querySelector('#timer-summary').textContent = `${timeLabel(Math.max(0, settings.minutes * 60 + settings.seconds))} on the clock`;
  };
  form.addEventListener('input', update);
  form.querySelectorAll('[data-pool]').forEach(button => button.addEventListener('click', () => {
    form.querySelectorAll(`input[name="${button.dataset.pool}"]`).forEach(input => { input.checked = button.dataset.action === 'all'; });
    update();
  }));
  form.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('#question-count').value = button.dataset.count;
    update();
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
    try {
      if (!form.checkValidity()) throw new Error('Check the question count and time fields.');
      session = startSession(settings.left, settings.right, settings.count, settings.minutes * 60 + settings.seconds);
      streak = 0;
      sound('correct');
      showPractice();
    } catch (error) {
      document.querySelector('#setup-error').textContent = error.message;
    }
  });
  update();
}

function showPractice() {
  shell(`<div class="practice-top"><div><span class="eyebrow">ONE QUESTION AT A TIME</span><h1>Let&#39;s find your rhythm.</h1></div><button class="text-button" id="finish">${icon('flag')} Finish early</button></div>
    <section class="practice-area" aria-label="Multiplication practice"><div class="practice-stats"><span id="question-position"></span><span id="streak">${icon('sparkles')}<span>Fresh start</span></span><span class="countdown" id="countdown" role="timer" aria-label="Time remaining">${icon('clock-3')}<strong id="time-left"></strong></span></div>
      <div class="progress-track" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="${session.questions.length}" aria-valuenow="0"><div id="progress-fill"></div></div>
      <form id="answer-form" novalidate><div class="equation"><span id="first-factor" class="factor first"></span><span class="operator">&times;</span><span id="second-factor" class="factor second"></span><span class="operator">=</span><label class="sr-only" for="answer">Your answer</label><input id="answer" type="text" inputmode="numeric" autocomplete="off" placeholder="?" maxlength="8" required aria-describedby="answer-error"></div><p id="answer-error" class="error" role="alert"></p><button class="primary-button" type="submit">Check answer ${icon('arrow-right')}</button></form>
      <p id="feedback" class="feedback" role="status" aria-live="polite">A fresh start. Take it one question at a time.</p>
    </section>
    <div class="practice-bottom"><span>${icon('target')} Your mix: ${settings.left.join(', ')} &times; ${settings.right.join(', ')}</span><span id="correct-so-far">0 correct so far</span></div>`, 'practice');
  renderQuestion();
  const tick = () => {
    const remaining = remainingSeconds(session);
    document.querySelector('#time-left').textContent = timeLabel(remaining);
    document.querySelector('#countdown').classList.toggle('urgent', remaining <= 10);
    if (remaining === 0) {
      finishSession(session, 'time');
      showResults();
    }
  };
  tick();
  interval = setInterval(tick, 100);
  document.querySelector('#answer-form').addEventListener('submit', event => {
    event.preventDefault();
    const input = document.querySelector('#answer');
    const raw = input.value.trim();
    if (Date.now() >= session.deadline) {
      finishSession(session, 'time');
      showResults();
      return;
    }
    if (!/^\d+$/.test(raw)) {
      document.querySelector('#answer-error').textContent = 'Type a whole number to continue.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    const result = submitAnswer(session, Number(raw));
    if (!result || session.endedAt !== null) {
      showResults();
      return;
    }
    streak = result.correct ? streak + 1 : 0;
    sound(result.correct ? 'correct' : 'try');
    const feedback = document.querySelector('#feedback');
    feedback.textContent = result.correct ? `${result.first} \u00d7 ${result.second} = ${result.expected}. Nice work!` : `${result.first} \u00d7 ${result.second} = ${result.expected}. Keep going, you've got another chance!`;
    feedback.className = `feedback ${result.correct ? 'good' : 'try'}`;
    document.querySelector('#streak span').textContent = streak > 1 ? `${streak} in a row!` : 'Keep going';
    renderQuestion();
  });
  document.querySelector('#finish').addEventListener('click', () => {
    finishSession(session, 'stopped');
    showResults();
  });
}

function renderQuestion() {
  const index = session.answers.length;
  const question = session.questions[index];
  document.querySelector('#first-factor').textContent = question.first;
  document.querySelector('#second-factor').textContent = question.second;
  document.querySelector('#question-position').textContent = `Question ${index + 1} of ${session.questions.length}`;
  document.querySelector('#progress-fill').style.width = `${index / session.questions.length * 100}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(index));
  document.querySelector('#correct-so-far').textContent = `${session.answers.filter(answer => answer.correct).length} correct so far`;
  document.querySelector('#answer-error').textContent = '';
  const input = document.querySelector('#answer');
  input.value = '';
  input.removeAttribute('aria-invalid');
  input.focus();
}

function showResults() {
  clearInterval(interval);
  const correct = session.answers.filter(answer => answer.correct).length;
  const mistakes = session.answers.filter(answer => !answer.correct);
  const unanswered = session.questions.length - session.answers.length;
  const accuracy = session.answers.length ? Math.round(correct / session.answers.length * 100) : 0;
  const elapsed = Math.max(0, Math.round((session.endedAt - session.startedAt) / 1000));
  if (session.reason === 'complete') sound('complete');
  else if (session.reason === 'time' && unanswered > 0) sound('timeout');
  shell(`<div class="results-heading"><span class="trophy-art" aria-hidden="true">${icon('trophy')}<span class="trophy-spark one">+</span><span class="trophy-spark two">+</span></span><span class="eyebrow">${session.reason === 'time' ? 'TIME IS UP' : session.reason === 'complete' ? 'CHALLENGE COMPLETE' : 'PRACTICE FINISHED'}</span><h1>${correct === session.questions.length ? 'A perfect little practice!' : correct > 0 ? 'Look at you making progress.' : 'Every try is a new beginning.'}</h1><p>${session.answers.length ? 'A little more confident than when you started.' : 'Come back for another go whenever you are ready.'}</p></div>
    <section class="result-stats" aria-label="Practice results"><div><span class="stat-label">${icon('check-check')} Correct</span><strong>${correct}<small> / ${session.answers.length}</small></strong></div><div><span class="stat-label">${icon('target')} Accuracy</span><strong>${accuracy}<small>%</small></strong></div><div><span class="stat-label">${icon('clock-3')} Time practiced</span><strong>${timeLabel(elapsed)}</strong></div><div><span class="stat-label">${icon('flag')} Unanswered</span><strong>${unanswered}</strong></div></section>
    <section class="review-section"><div class="review-heading"><h2>${mistakes.length ? 'A few to practice next time' : 'Nothing to review'}</h2><span>${mistakes.length} ${mistakes.length === 1 ? 'question' : 'questions'}</span></div>${mistakes.length ? `<div class="table-scroll"><table><thead><tr><th>Question</th><th>Your answer</th><th>Correct answer</th></tr></thead><tbody>${mistakes.map(answer => `<tr><td>${answer.first} &times; ${answer.second}</td><td class="wrong-answer">${icon('x')} ${answer.answer}</td><td class="right-answer">${icon('check')} ${answer.expected}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-review">${icon('check')}<p>${session.answers.length ? 'You got every question you answered right.' : 'No answers yet. Your next practice is a fresh start.'}</p></div>`}</section>
    <div class="results-actions"><button class="text-button" id="change-settings">${icon('arrow-left')} Change settings</button><button class="primary-button" id="again">${icon('rotate-ccw')} Practice again</button></div>`, 'results');
  document.querySelector('#change-settings').addEventListener('click', showSetup);
  document.querySelector('#again').addEventListener('click', () => {
    session = startSession(settings.left, settings.right, settings.count, settings.minutes * 60 + settings.seconds);
    streak = 0;
    showPractice();
  });
}

showSetup();