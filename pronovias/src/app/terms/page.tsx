// Destinazione nel repo: pronovias/src/app/terms/page.tsx
// Pagina pubblica /terms — richiesta da TCR per sbloccare l'A2P.

export const metadata = {
  title: 'Terms & Conditions | Mayller Bridal Italian Style',
  description: 'Terms & Conditions including SMS messaging terms for Mayller Bridal Italian Style.',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-white/80">
      <p className="text-amber-300/60 text-xs tracking-[0.35em] uppercase mb-4">Mayller Bridal Italian Style</p>
      <h1 className="text-4xl font-light text-white tracking-widest mb-2">Terms &amp; Conditions</h1>
      <p className="text-white/40 text-sm mb-12">Last updated: May 31, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <p>
          These Terms &amp; Conditions govern your use of the Mayller Bridal Italian Style LLC website and
          services, including our SMS text messaging program.
        </p>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Appointments</h2>
          <p>
            Appointments may be booked online at mayllerbridal.com or by phone. By booking, you agree to
            provide accurate information. To cancel or reschedule, please contact us at least 24 hours in
            advance at (484) 760-0475.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">SMS Terms</h2>
          <p className="mb-3">
            When you opt in to our SMS program, you agree to receive transactional text messages related to
            your appointments (confirmations, reschedules, and cancellations).
          </p>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li>Program: Mayller Bridal appointment notifications.</li>
            <li>Message frequency varies based on your appointment activity.</li>
            <li>Message and data rates may apply.</li>
            <li>Text STOP to cancel at any time. Text HELP for help.</li>
            <li>Carriers are not liable for delayed or undelivered messages.</li>
            <li>Supported carriers may include AT&amp;T, Verizon, T-Mobile, and others; carrier support is not guaranteed.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Consent</h2>
          <p>
            Consent to receive SMS messages is not a condition of any purchase or service. You may opt out at
            any time without affecting your appointment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Contact Us</h2>
          <p className="text-white/70">
            Mayller Bridal Italian Style LLC<br />
            4054 W Penn Ave, Sinking Spring, PA 19608<br />
            Phone: (484) 760-0475<br />
            Email: mayllerbridalitalianstyle@gmail.com
          </p>
        </section>
      </div>
    </main>
  )
}
