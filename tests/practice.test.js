import test from 'node:test';
import assert from 'node:assert/strict';
import { makeQuestions, startSession, remainingSeconds, submitAnswer, finishSession } from '../src/practice.js';

test('questions use the Cartesian product and exhaust a shuffled cycle before repeating', () => {
  const questions = makeQuestions([1, 2, 3, 4], [3, 4, 5], 25);
  assert.equal(questions.length, 25);
  assert.ok(questions.every(({ first, second }) => [1, 2, 3, 4].includes(first) && [3, 4, 5].includes(second)));
  assert.equal(new Set(questions.slice(0, 12).map(({ first, second }) => `${first}:${second}`)).size, 12);
});

test('all answered questions finish a session and retain wrong answers', () => {
  const session = startSession([2], [3], 2, 60, 1000);
  assert.equal(submitAnswer(session, 5, 2000).correct, false);
  assert.equal(submitAnswer(session, 6, 3000).correct, true);
  assert.equal(session.reason, 'complete');
  assert.equal(session.answers[0].expected, 6);
  assert.equal(submitAnswer(session, 6, 4000), null);
});

test('countdown uses the deadline and rejects answers at expiry', () => {
  const session = startSession([2], [3], 10, 5, 1000);
  assert.equal(remainingSeconds(session, 1100), 5);
  assert.equal(remainingSeconds(session, 5999), 1);
  assert.equal(submitAnswer(session, 6, 6000), null);
  assert.equal(session.reason, 'time');
  assert.equal(session.answers.length, 0);
  assert.equal(remainingSeconds(session, 7000), 0);
});

test('invalid settings and answers cannot change progress', () => {
  assert.throws(() => makeQuestions([], [2], 10));
  assert.throws(() => makeQuestions([2], [], 10));
  assert.throws(() => makeQuestions([2], [3], 0));
  assert.throws(() => startSession([2], [3], 10, 0));
  const session = startSession([2], [3], 10, 60, 0);
  assert.throws(() => submitAnswer(session, NaN, 1000));
  assert.throws(() => submitAnswer(session, 1.5, 1000));
  assert.equal(session.answers.length, 0);
});

test('ending a session is idempotent', () => {
  const session = startSession([2], [3], 10, 60, 0);
  finishSession(session, 'stopped', 2000);
  finishSession(session, 'time', 60000);
  assert.equal(session.reason, 'stopped');
  assert.equal(session.endedAt, 2000);
});