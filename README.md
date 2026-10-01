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

## Run

Requires Node.js 22 or a compatible Node.js version supported by Vite 6.

```sh
npm install
npm run dev
```

Open the local address printed by Vite, normally http://127.0.0.1:5173.
Keep the terminal running while using the app. The VS Code task
`Start Times Club` can also launch the development server on this machine.

A checksum-verified portable Node.js 22.14.0 runtime was downloaded for this
workspace session under `%LOCALAPPDATA%\TimesClub\runtime`. If Node.js is not
on your PATH, use that runtime's `npm.cmd` for the commands above, or install
Node.js and reopen the terminal.

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
