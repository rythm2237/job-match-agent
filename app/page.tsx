"use client";

import { FormEvent, useState } from "react";

const countries = ["Hungary", "Germany", "Netherlands", "Ireland", "United Kingdom", "Austria", "Switzerland", "Remote"];

export default function HomePage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/subscribe", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Registration failed.");
      setStatus("success");
      setMessage(payload.message);
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    }
  }

  return (
    <main>
      <header className="nav">
        <a className="brand" href="#top"><span className="logo">◎</span> Job Match Agent</a>
        <nav><a href="#how">How it works</a><a href="#privacy">Privacy</a></nav>
        <a className="status" href="#setup"><span /> Daily agent</a>
      </header>

      <section id="top" className="hero">
        <div className="intro">
          <p className="eyebrow">YOUR PERSONAL JOB SCOUT</p>
          <h1>Wake up to roles that <em>actually fit.</em></h1>
          <p className="lead">AI reads your experience once, checks trusted job sources every morning, and emails only opportunities that match you 70% or more.</p>
          <p className="privacy-line">✓ Your original resume is processed in memory and never stored.</p>

          <form id="setup" className="card form" onSubmit={submit}>
            <div className="form-heading"><div><small>THREE QUICK STEPS</small><h2>Set up your agent</h2></div><span className="private">● Private</span></div>
            <div className="steps"><b>1 Profile</b><span>2 Resume</span><span>3 Schedule</span></div>
            <label>Email address<input required type="email" name="email" placeholder="you@example.com" /></label>
            <label>Target role<input required name="targetRole" minLength={2} maxLength={120} placeholder="e.g. AI Automation Specialist" /></label>
            <label>Target country<select required name="targetCountry" defaultValue=""><option value="" disabled>Select a country</option>{countries.map(country => <option key={country}>{country}</option>)}</select></label>
            <div className="row">
              <label>Delivery time<input required name="deliveryTime" type="time" defaultValue="08:00" /></label>
              <label>Timezone<input required name="timezone" defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} /></label>
            </div>
            <label>Resume<input required name="resume" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" /></label>
            <label className="consent"><input required name="consent" type="checkbox" /> I agree to receive job-match emails and accept the privacy terms.</label>
            <button disabled={status === "loading"} type="submit">{status === "loading" ? "Analyzing your resume…" : "Start my daily search"}</button>
            {message && <p className={`notice ${status}`}>{message}</p>}
          </form>
        </div>

        <aside className="signal">
          <div className="signal-head"><h2>Today&apos;s match signal</h2><span>● Agent ready</span></div>
          <div className="score"><strong>70<sup>%</sup></strong><b>minimum match</b></div>
          <div className="feature-grid"><span>✓ Trusted sources</span><span>◷ 08:00 local delivery</span><span>⌁ No repeat jobs</span></div>
          <div className="digest"><p>EXAMPLE DIGEST</p>{[["AI Solutions Consultant","Amsterdam, NL","92%"],["Automation Specialist","Budapest, HU","86%"],["Power Platform Consultant","Remote EU","79%"]].map(job => <article key={job[0]}><div><b>{job[0]}</b><small>{job[1]}</small></div><strong>{job[2]} match</strong></article>)}</div>
        </aside>
      </section>

      <section id="how" className="info"><h2>How it works</h2><p>Your resume is converted into a structured skills profile. Every scheduled run collects current jobs, computes a transparent relevance score, removes duplicates, and emails only qualifying roles.</p></section>
      <section id="privacy" className="info"><h2>Privacy</h2><p>The uploaded file is not persisted. You can unsubscribe and request deletion using the secure links included in every email.</p></section>
    </main>
  );
}
