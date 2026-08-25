export default function Terms() {
  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h2 style={{ marginBottom: 4 }}>Terms & Conditions</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginBottom: 24 }}>Last updated: July 2026</p>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>1. What SkillSwap is</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          SkillSwap is a platform for people to exchange skills and knowledge with each other directly.
          No money changes hands through the platform, and SkillSwap does not process payments,
          issue invoices, or act as an employer or contractor on behalf of any user.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>2. Eligibility</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          You must be at least 18 years old to create an account. By registering, you confirm the
          information you provide (name, skills, location) is accurate and that you intend to use
          the platform to genuinely exchange skills, not to advertise unrelated services or content.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>3. Your safety, your responsibility</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          SkillSwap connects people; it does not verify identities, background-check users, or
          supervise sessions. When meeting someone from this platform, especially in person:
        </p>
        <ul style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.9, marginTop: 8, paddingLeft: 20 }}>
          <li>Meet in a public place for the first session</li>
          <li>Tell a friend or family member where you're going and who you're meeting</li>
          <li>Trust your judgment — you can decline or cancel a swap at any time</li>
          <li>Use the in-app chat to agree on details before sharing personal contact information</li>
        </ul>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7, marginTop: 8 }}>
          SkillSwap is not liable for what happens during a session arranged through the platform.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>4. Acceptable use</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          You agree not to use SkillSwap to: harass or abuse other users; post false, misleading,
          or illegal skill listings; solicit money, cryptocurrency, or gifts in exchange for a
          "skill"; or attempt to access another user's account. Accounts that violate this may be
          suspended or banned by an administrator.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>5. Content & reviews</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          You're responsible for what you post — skill descriptions, messages, and reviews. Reviews
          must reflect a genuine completed swap. Reviews that are abusive, defamatory, or unrelated
          to an actual swap may be removed.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>6. Your data</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          Your profile, skill listings, and messages are stored to operate the platform. Your email
          is never shown to other users. You can request deletion of your account and associated
          data at any time by contacting an administrator.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>7. Changes to these terms</h3>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
          These terms may be updated as the platform grows. Continued use after a change means you
          accept the updated terms.
        </p>
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 20 }}>
        This is a template for a student/internship project and is not reviewed by a lawyer.
        Adapt it before using in a real production product.
      </p>
    </div>
  );
}
