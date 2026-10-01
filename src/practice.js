export function makeQuestions(left, right, count, random = Math.random) {
  if (!left.length || !right.length) throw new Error('Choose numbers on both sides.');
  if (!Number.isInteger(count) || count < 1 || count > 200) throw new Error('Choose 1 to 200 questions.');
  const combinations = left.flatMap(first => right.map(second => ({ first, second })));
  const questions = [];
  while (questions.length < count) {
    const cycle = [...combinations];
    for (let index = cycle.length - 1; index > 0; index--) {
      const target = Math.floor(random() * (index + 1));
      [cycle[index], cycle[target]] = [cycle[target], cycle[index]];
    }
    questions.push(...cycle.slice(0, count - questions.length));
  }
  return questions;
}

export function startSession(left, right, count, seconds, now = Date.now()) {
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) throw new Error('Choose a practice time from 1 second to 60 minutes.');
  return { questions: makeQuestions(left, right, count), answers: [], startedAt: now, deadline: now + seconds * 1000, duration: seconds, endedAt: null, reason: null };
}

export function remainingSeconds(session, now = Date.now()) {
  return Math.max(0, Math.ceil((session.deadline - now) / 1000));
}

export function finishSession(session, reason, now = Date.now()) {
  if (session.endedAt !== null) return;
  session.endedAt = Math.min(now, session.deadline);
  session.reason = reason;
}

export function submitAnswer(session, answer, now = Date.now()) {
  if (session.endedAt !== null) return null;
  if (now >= session.deadline) {
    finishSession(session, 'time', now);
    return null;
  }
  if (!Number.isSafeInteger(answer) || answer < 0) throw new Error('Enter a whole number, zero or greater.');
  const question = session.questions[session.answers.length];
  const result = { ...question, answer, expected: question.first * question.second, correct: answer === question.first * question.second };
  session.answers.push(result);
  if (session.answers.length === session.questions.length) finishSession(session, 'complete', now);
  return result;
}