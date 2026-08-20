export default function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow">KE-WAR</p>

        <h1>WHICH ARE YOU IN?</h1>

        <p className="intro">
          Make your choice. Make your voice heard.
        </p>

        <p className="description">
          KE-WAR is Kenya's platform for political sentiment — built around the two
          most talked-about positions in the country right now. WANTAM stands for the
          belief that the current President should serve only one term. TUTAM stands
          for the belief that he deserves a second term. Pick your side, vote for your
          preferred ticket, and join a community of Kenyans who back the same cause.
        </p>

        <div className="battle">
          <div className="side wantam">
            <span className="side-label">WANTAM</span>
            <h2>ONE TERM</h2>
            <p>Do you support the current President serving only one presidential term?</p>
          </div>

          <div className="versus">VS</div>

          <div className="side tutam">
            <span className="side-label">TUTAM</span>
            <h2>SECOND TERM</h2>
            <p>Do you support the current President seeking a second presidential term?</p>
          </div>
        </div>

        <a href="/register" className="enter-button">
          ENTER KE-WAR
        </a>

        <p className="login-text">
          Already have a KE-WAR account?{" "}
          <a href="/login">LOGIN</a>
        </p>
      </section>
    </main>
  );
            }
