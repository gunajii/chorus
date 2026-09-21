import Link from "next/link";

export const metadata = { title: "About — Chorus" };

export default function About() {
  return (
    <main className="page">
      <Link href="/" className="back">← Back to today's puzzle</Link>
      <h1>About Chorus</h1>
      <p className="subtitle">A tiny daily game about the wisdom (and weirdness) of crowds.</p>

      <p>
        Most guessing games ask what the answer <em>is</em>. Chorus asks what <em>everyone else</em> thinks it is.
        Each day there's one question and five hidden answers — the ones the crowd picked most — and your job is
        to read the room and uncover them before your guesses run out.
      </p>
      <p>
        It's built to be a 60-second ritual: quick to play, fun to argue about, and better with friends. Same
        puzzle for everyone, every day, so you can compare scores and settle who really knows the crowd.
      </p>

      <h2>Play with friends</h2>
      <p>
        Create a private group, share the code, and everyone's daily result lands on one leaderboard — ranked by
        answers found, then fewest guesses, then fastest time. It's the group-chat Wordle debate, but with a
        scoreboard.
      </p>

      <h2>Made by</h2>
      <p>
        Chorus is an independent project. Got a question idea or feedback? That's the fuel — every prompt is one
        someone was curious to see the crowd answer.
      </p>

      <Link href="/" className="cta-play">Play today's puzzle</Link>
    </main>
  );
}
