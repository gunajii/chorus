import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Logo size={18} />
        <nav className="footer-nav">
          <Link href="/">Play</Link>
          <Link href="/how-to-play">How to play</Link>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <div className="footer-copy">© {new Date().getFullYear()} Chorus · A daily crowd-guessing game</div>
      </div>
    </footer>
  );
}
