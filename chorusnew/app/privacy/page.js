import Link from "next/link";

export const metadata = { title: "Privacy Policy — Chorus" };

export default function Privacy() {
  return (
    <main className="page">
      <Link href="/" className="back">← Back to today's puzzle</Link>
      <h1>Privacy Policy</h1>
      <p className="subtitle">Last updated: {new Date().getFullYear()}. Plain-language summary below.</p>

      <p>
        Chorus is a daily game. We try to collect as little as possible and we don't ask you to sign up or share
        your email to play.
      </p>

      <h2>What we store</h2>
      <ul>
        <li><b>An anonymous device ID.</b> A random identifier is kept in your browser's local storage so we can
          remember your streak and stop you replaying the same day's puzzle. It isn't tied to your real identity.</li>
        <li><b>A display name (optional).</b> If you create or join a friends group, the name you choose is stored
          so it can appear on that group's leaderboard.</li>
        <li><b>Your daily results.</b> Your score, number of guesses, and solve time for each day, used to build
          the leaderboards.</li>
        <li><b>Group membership.</b> Which groups you've joined, by their invite codes.</li>
      </ul>
      <p>We do not collect your name, email, precise location, or contacts, and we don't sell personal data.</p>

      <h2>Local storage</h2>
      <p>
        We use your browser's local storage (not tracking cookies of our own) to keep your device ID, streak, and
        preferences on your device. Clearing your browser data will reset these.
      </p>

      <h2>Advertising</h2>
      <p>
        This site may display ads served by Google AdSense. Third-party vendors, including Google, use cookies to
        serve ads based on your prior visits to this and other websites. Google's use of advertising cookies
        enables it and its partners to serve ads to you based on your visit to this and/or other sites.
      </p>
      <ul>
        <li>You can opt out of personalised advertising by visiting{" "}
          <a className="link" href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</li>
        <li>Learn how Google uses data from sites that use its services at{" "}
          <a className="link" href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">policies.google.com/technologies/partner-sites</a>.</li>
        <li>You can opt out of third-party vendor cookies at{" "}
          <a className="link" href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info/choices</a>.</li>
      </ul>

      <h2>Children</h2>
      <p>Chorus isn't directed at children under 13, and we don't knowingly collect data from them.</p>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Reach out at <b>your-email@example.com</b> (update this before launch).
      </p>

      <Link href="/" className="cta-play">Play today's puzzle</Link>
    </main>
  );
}
