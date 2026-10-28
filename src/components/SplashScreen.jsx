export default function SplashScreen() {
  return (
    <main className="splash-screen">
      <section className="splash-card" aria-label="Loading Agriculture Monitoring System">
        <img
          className="splash-logo"
          src="/images/logo.png"
          alt="Agriculture Monitoring System logo"
        />
        <h1>Agriculture Monitoring System</h1>
        <p>Growing a smarter future</p>
        <div className="splash-progress" role="progressbar" aria-label="Loading" />
      </section>
    </main>
  );
}
