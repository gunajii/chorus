import Link from "next/link";

export const metadata = { title: "How to play — Chorus" };

export default function HowToPlay() {
  return (
    <main className="page">
      <Link href="/" className="back">← Back to today's puzzle</Link>
      <h1>How to play</h1>
      <p className="subtitle">One question a day. Guess what the crowd said — not what you'd say.</p>

      <div className="steps">
        <div className="step"><div className="n">1</div><div>
          <p className="st-b">Read the question</p>
          <p className="st-p">Something everyone has an opinion on — like “the best pizza topping?”</p>
        </div></div>
        <div className="step"><div className="n">2</div><div>
          <p className="st-b">Guess the crowd's Top 5</p>
          <p className="st-p">There are 5 hidden answers: the ones most players gave. Type your guesses to uncover them.</p>
        </div></div>
        <div className="step"><div className="n">3</div><div>
          <p className="st-b">Mind your tries</p>
          <p className="st-p">You get a limited number of guesses. Each hit fills a slot with its rank and the % who said it; each miss burns a try.</p>
        </div></div>
        <div className="step"><div className="n">4</div><div>
          <p className="st-b">Keep your streak</p>
          <p className="st-p">Catch the crowd's <b>#1</b> answer to keep your streak alive. Miss it and the streak resets.</p>
        </div></div>
        <div className="step"><div className="n">5</div><div>
          <p className="st-b">Race your friends</p>
          <p className="st-p">Everyone plays the same puzzle. Create a private group, share the code, and climb the daily leaderboard — ranked by answers found, then fewest guesses, then fastest time.</p>
        </div></div>
      </div>

      <p>A new puzzle drops every day at midnight. That's it — think like the crowd.</p>
      <Link href="/" className="cta-play">Play today's puzzle</Link>
    </main>
  );
}
