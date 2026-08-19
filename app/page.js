export default function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow">WAR</p>

        <h1>WHICH ARE YOU IN?</h1>

        <p className="intro">
          Make your choice. Make your voice heard.
        </p>

        <div className="battle">
          <div className="side wantam">
            <span className="side-label">WANTAM</span>
            <h2>ONE TERM</h2>
            <p>Do you support the current President serving only one presidential term?</p>
            <strong>0 VOTES</strong>
          </div>

          <div className="versus">VS</div>

          <div className="side tutam">
            <span className="side-label">TUTAM</span>
            <h2>SECOND TERM</h2>
            <p>Do you support the current President seeking a second presidential term?</p>
            <strong>0 VOTES</strong>
          </div>
        </div>

        <a href="/register" className="enter-button">
          ENTER WAR
        </a>

        <p className="login-text">
          Already have a WAR account?{" "}
          <a href="/login">LOGIN</a>
        </p>
      </section>
    </main>
  );
}
