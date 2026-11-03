# multiplikationstabellen
A software to practice multiplication for kids.

## Times Club

A child-friendly multiplication practice GUI that runs in a web browser.

- Select two independent sets of factors from 1 to 12. For example, choosing
	`1, 2, 3, 4` on the left and `3, 4, 5` on the right gives 12 combinations.
- Set 1 to 200 questions and a countdown from 1 second to 60 minutes.
- Questions are shuffled, using each selected combination once before starting
	another shuffled cycle when more questions are requested.
- Type an answer and press Enter, or use the Check answer button.
- Practice ends when the timer expires, all questions have been answered, or
	Finish early is selected. Incorrect answers count as answered questions.
- Results show correct answers, accuracy among answered questions, elapsed
	time, unanswered questions, and each mistake with its correct answer.
- Optional cheering sounds are generated locally. Use the speaker button to mute.
- Practice again uses the same settings with a new question mix.

## Start the app

Requires Node.js 22 or a compatible version supported by Vite 6. If Node.js is
not installed or is not on your PATH, install Node.js 22 and reopen the
terminal before starting the app.

```sh
npm install
npm start
```

This starts the built-in static server and serves the app at
http://127.0.0.1:3000.

If you want the Vite development server instead, use:

```sh
npm run dev
```

The development server is available on http://127.0.0.1:5173.

## Verify

```sh
npm test
npm run build
npm run preview
```

The tests cover factor selection, shuffled cycles, answer recording, session
completion, invalid input, and countdown expiry. The production build is created
in `dist/`; serve it using the preview command or a static web host.

There is no account, backend, or tracking, and answers are not saved between
sessions. Fonts are fetched from Google Fonts when online; fallback fonts are
used when unavailable. All practice logic and sounds run locally.
