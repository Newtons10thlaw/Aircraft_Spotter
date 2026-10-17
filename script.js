'use strict';

// Photos are requested from Wikipedia's API at runtime. No images are bundled
// in this repository. PageImages selects a representative photo for each article.
const AIRCRAFT = [
  { brand: 'Airbus', model: 'Airbus A220', article: 'Airbus A220', clue: 'The A220 is a compact twinjet originally developed as the Bombardier CSeries.' },
  { brand: 'Airbus', model: 'Airbus A300', article: 'Airbus A300', clue: 'A pioneering twin-engine widebody: the A300 was Airbus’s first production airliner.' },
  { brand: 'Airbus', model: 'Airbus A310', article: 'Airbus A310', clue: 'The A310 is a relatively short, two-engine widebody with a broad fuselage.' },
  { brand: 'Airbus', model: 'Airbus A318', article: 'Airbus A318', clue: 'The shortest member of the classic A320 family, with familiar Airbus cockpit windows.' },
  { brand: 'Airbus', model: 'Airbus A319', article: 'Airbus A319', clue: 'A short member of the A320 family. Notice the characteristic Airbus nose and cockpit glazing.' },
  { brand: 'Airbus', model: 'Airbus A320', article: 'Airbus A320 family', clue: 'On many A320-family jets, the cockpit window geometry and comparatively rounded nose give the game away.' },
  { brand: 'Airbus', model: 'Airbus A321', article: 'Airbus A321', clue: 'The A321 stretches the familiar A320-family fuselage considerably further.' },
  { brand: 'Airbus', model: 'Airbus A330', article: 'Airbus A330', clue: 'A two-engine Airbus widebody. Compare its engines and wing arrangement with the four-engine A340.' },
  { brand: 'Airbus', model: 'Airbus A340', article: 'Airbus A340', clue: 'Four underwing engines are the quickest visual clue for the Airbus A340.' },
  { brand: 'Airbus', model: 'Airbus A350', article: 'Airbus A350', clue: 'The A350’s dark, mask-like windshield surround is one of its most distinctive features.' },
  { brand: 'Airbus', model: 'Airbus A380', article: 'Airbus A380', clue: 'The full-length double-decker fuselage and four engines are unmistakable A380 features.' },
  { brand: 'Boeing', model: 'Boeing 707', article: 'Boeing 707', clue: 'An early four-engine narrowbody jetliner with swept wings, long before modern widebodies.' },
  { brand: 'Boeing', model: 'Boeing 717', article: 'Boeing 717', clue: 'The 717 has rear-mounted engines and a T-tail, unlike Boeing’s larger underwing-engine jets.' },
  { brand: 'Boeing', model: 'Boeing 727', article: 'Boeing 727', clue: 'Three engines clustered at the rear and a high T-tail are distinctive 727 features.' },
  { brand: 'Boeing', model: 'Boeing 737', article: 'Boeing 737', clue: 'The low-slung 737 sits close to the ground; some variants have noticeably flattened engine nacelles.' },
  { brand: 'Boeing', model: 'Boeing 747', article: 'Boeing 747', clue: 'The famous upper-deck hump above the cockpit makes the 747 easy to recognise.' },
  { brand: 'Boeing', model: 'Boeing 757', article: 'Boeing 757', clue: 'A long, slender narrowbody with tall landing gear and a notably pointed nose.' },
  { brand: 'Boeing', model: 'Boeing 767', article: 'Boeing 767', clue: 'A medium-to-large twin-engine widebody, smaller in overall scale than the 777.' },
  { brand: 'Boeing', model: 'Boeing 777', article: 'Boeing 777', clue: 'Huge underwing engines and six-wheel main landing gear bogies are tell-tale 777 details.' },
  { brand: 'Boeing', model: 'Boeing 787 Dreamliner', article: 'Boeing 787 Dreamliner', clue: 'Look for the sleek nose, swept-back wing tips and gently scalloped engine exhaust edges.' },
];

const ROUND_TARGET = 10;
const API_ENDPOINT = 'https://en.wikipedia.org/w/api.php';
const $ = (id) => document.getElementById(id);
const ui = {
  quiz: $('quiz-view'), summary: $('summary-view'), photo: $('plane-photo'),
  backdrop: $('photo-backdrop'), stage: $('photo-stage'), wait: $('photo-wait'),
  roundLabel: $('round-label'), counter: $('photo-counter'),
  buttons: [$('airbus-btn'), $('boeing-btn')], feedback: $('feedback'),
  heading: $('feedback-heading'), model: $('feedback-model'), tip: $('feedback-tip'),
  credit: $('credit-line'), next: $('next-btn'), retry: $('retry-btn'),
  keys: $('keyboard-hint'), bar: $('progress-bar'),
  score: $('score-stat'), streak: $('streak-stat'), best: $('best-stat'),
  summaryHeading: $('summary-heading'), summarySubheading: $('summary-subheading'),
  summaryNumber: $('summary-number'), replay: $('play-again-btn'),
};

let imageLibrary = [];
let roundCards = [];
let position = 0;
let correct = 0;
let answered = 0;
let streak = 0;
let locked = true;
let best = readBest();
let loadToken = 0;

function readBest() {
  try { return Number(localStorage.getItem('planespotter-best') || 0) || 0; }
  catch { return 0; }
}
function saveBest(value) {
  try { localStorage.setItem('planespotter-best', String(value)); }
  catch { /* Storage can be unavailable (e.g. private browsing). */ }
}
function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function updateStats() {
  ui.score.textContent = `${correct} / ${answered}`;
  ui.streak.innerHTML = `${streak} <span class="stat-symbol">↗</span>`;
  ui.best.textContent = best ? `${best} / ${ROUND_TARGET}` : '—';
}
function apiURL(parameters) {
  return `${API_ENDPOINT}?${new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*', ...parameters,
  }).toString()}`;
}
function fileKey(name) { return name.replace(/^File:/i, '').replace(/_/g, ' ').trim().toLowerCase(); }
function plainText(html) {
  const documentFragment = new DOMParser().parseFromString(html || '', 'text/html');
  return (documentFragment.body.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 110);
}
async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Photo service returned ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.info || 'Photo service error');
  return data;
}
async function fetchAircraft() {
  const titles = AIRCRAFT.map((a) => a.article).join('|');
  const data = await getJSON(apiURL({ prop: 'pageimages', piprop: 'thumbnail|name',
    pithumbsize: '1400', pilicense: 'free', redirects: '1', titles }));
  const pages = new Map((data.query?.pages || []).map((page) => [page.title, page]));
  const found = AIRCRAFT.flatMap((aircraft) => {
    const page = pages.get(aircraft.article);
    const image = page?.thumbnail?.source;
    if (!image || !image.startsWith('https://') || !page.pageimage) return [];
    const filePage = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage.replace(/ /g, '_'))}`;
    return [{ ...aircraft, image, filename: page.pageimage, filePage, credit: null }];
  });
  if (found.filter((a) => a.brand === 'Airbus').length < 5 ||
      found.filter((a) => a.brand === 'Boeing').length < 5) {
    throw new Error('Not enough aircraft photos were available for a balanced round.');
  }
  return found;
}
async function loadPhotoCredits(cards) {
  // Optional, non-blocking metadata call. File-page links still work if it fails.
  try {
    const titles = cards.map((card) => `File:${card.filename}`).join('|');
    const data = await getJSON(apiURL({ prop: 'imageinfo', iiprop: 'url|extmetadata', iilimit: '1', titles }));
    const creditLookup = new Map();
    for (const page of data.query?.pages || []) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata || {};
      creditLookup.set(fileKey(page.title), {
        author: plainText(meta.Artist?.value), license: plainText(meta.LicenseShortName?.value),
        source: info.descriptionurl || '',
      });
    }
    for (const card of cards) card.credit = creditLookup.get(fileKey(card.filename)) || null;
    // A user may already have answered before the metadata arrives.
    if (locked && roundCards[position] && !ui.feedback.hidden) showCredit(roundCards[position]);
  } catch (error) { console.info('Photo credit lookup unavailable:', error); }
}
function showCredit(card) {
  ui.credit.replaceChildren();
  const credit = card.credit;
  const prefix = document.createElement('span');
  const author = credit?.author ? `Photo: ${credit.author}` : 'Photo: Wikimedia Commons';
  prefix.textContent = `${author}${credit?.license ? ` · ${credit.license}` : ''} · `;
  const link = document.createElement('a');
  link.href = credit?.source?.startsWith('https://') ? credit.source : card.filePage;
  link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.textContent = 'Source & licence ↗';
  ui.credit.append(prefix, link);
}
function pickRound() {
  const a = shuffled(imageLibrary.filter((card) => card.brand === 'Airbus')).slice(0, ROUND_TARGET / 2);
  const b = shuffled(imageLibrary.filter((card) => card.brand === 'Boeing')).slice(0, ROUND_TARGET / 2);
  return shuffled([...a, ...b]);
}
function startGame() {
  if (!imageLibrary.length) return;
  roundCards = pickRound();
  position = 0; correct = 0; answered = 0; streak = 0; locked = true;
  ui.summary.hidden = true;
  ui.quiz.hidden = false;
  updateStats();
  showRound();
}
function showRound() {
  const token = ++loadToken;
  const card = roundCards[position];
  locked = true;
  ui.feedback.hidden = true; ui.feedback.classList.remove('wrong');
  ui.next.hidden = true; ui.retry.hidden = true; ui.keys.hidden = false;
  ui.stage.classList.add('image-loading');
  ui.wait.innerHTML = '<span class="spinner"></span><span>LOADING AIRCRAFT PHOTO…</span>';
  for (const button of ui.buttons) {
    button.disabled = true;
    button.classList.remove('correct', 'incorrect', 'dimmed');
  }
  const number = String(position + 1).padStart(2, '0');
  ui.roundLabel.innerHTML = `AIRCRAFT ${number} <span class="muted">/ ${ROUND_TARGET}</span>`;
  ui.counter.textContent = `${number} — ${ROUND_TARGET}`;
  ui.bar.style.width = `${(position / roundCards.length) * 100}%`;
  ui.photo.alt = 'Unidentified passenger aircraft. Choose Airbus or Boeing.';
  ui.photo.onload = () => {
    if (token !== loadToken) return;
    ui.stage.classList.remove('image-loading');
    for (const button of ui.buttons) button.disabled = false;
    locked = false;
  };
  ui.photo.onerror = () => {
    if (token !== loadToken) return;
    ui.wait.replaceChildren();
    const error = document.createElement('span');
    error.textContent = 'THIS PHOTO COULD NOT LOAD.';
    ui.wait.appendChild(error);
    ui.keys.hidden = true;
    ui.next.textContent = 'SKIP THIS PHOTO →';
    ui.next.hidden = false;
    locked = true;
  };
  ui.photo.removeAttribute('src');
  ui.backdrop.src = card.image;
  ui.photo.src = card.image;
}
function chooseAnswer(guess) {
  if (locked || !roundCards[position]) return;
  locked = true;

  recordPlay();
  const card = roundCards[position];
  const success = guess === card.brand;
  answered++;
  if (success) { correct++; streak++; }
  else streak = 0;
  updateStats();
  for (const button of ui.buttons) {
    button.disabled = true;
    const brand = button.dataset.answer;
    if (brand === card.brand) button.classList.add('correct');
    else if (brand === guess) button.classList.add('incorrect');
    else button.classList.add('dimmed');
  }
  ui.feedback.classList.toggle('wrong', !success);
  ui.heading.textContent = success ? '✓ CORRECT IDENTIFICATION' : '✕ NOT QUITE — HERE’S THE ANSWER';
  ui.model.textContent = card.model;
  ui.tip.textContent = card.clue;
  showCredit(card);
  ui.feedback.hidden = false;
  ui.keys.hidden = true;
  ui.next.textContent = position === roundCards.length - 1 ? 'SEE YOUR RESULTS ↗' : 'NEXT AIRCRAFT ↗';
  ui.next.hidden = false;
  ui.bar.style.width = `${((position + 1) / roundCards.length) * 100}%`;
}
function next() {
  if (ui.next.hidden) return;
  if (position + 1 >= roundCards.length) return finishGame();
  position++;
  showRound();
}
function finishGame() {
  if (correct > best) { best = correct; saveBest(best); }
  updateStats();
  ui.quiz.hidden = true; ui.summary.hidden = false;
  ui.summaryHeading.textContent = correct >= 9 ? 'Eagle eyes.' : correct >= 7 ? 'Nicely spotted.' : correct >= 4 ? 'Getting sharper.' : 'Keep your eyes on the skies.';
  ui.summarySubheading.textContent = `You recognised ${correct} out of ${answered} aircraft. Every flight makes you a better spotter.`;
  ui.summaryNumber.innerHTML = `${correct}<span> / ${roundCards.length}</span>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function initialise() {
  ui.retry.hidden = true;
  ui.keys.hidden = true;
  ui.wait.innerHTML = '<span class="spinner"></span><span>FINDING AIRCRAFT PHOTOS ONLINE…</span>';
  updateStats();
  try {
    imageLibrary = await fetchAircraft();
    startGame();
    void loadPhotoCredits(imageLibrary);
  } catch (error) {
    console.error('Could not fetch aircraft pictures:', error);
    ui.wait.replaceChildren();
    const message = document.createElement('span');
    message.textContent = 'COULD NOT REACH WIKIPEDIA. CHECK YOUR CONNECTION.';
    message.style.textAlign = 'center';
    message.style.padding = '15px';
    ui.wait.appendChild(message);
    ui.retry.hidden = false;
  }
}
for (const button of ui.buttons) button.addEventListener('click', () => chooseAnswer(button.dataset.answer));
ui.next.addEventListener('click', next);
ui.retry.addEventListener('click', initialise);
ui.replay.addEventListener('click', startGame);
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || ui.quiz.hidden) return;
  const target = event.target;
  if (target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
  if (!locked && event.key.toLowerCase() === 'a') chooseAnswer('Airbus');
  if (!locked && event.key.toLowerCase() === 'b') chooseAnswer('Boeing');
  if (locked && !ui.next.hidden && event.key === 'Enter') next();
});
initialise();
