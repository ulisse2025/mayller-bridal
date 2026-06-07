// Destinazione nel repo: pronovias/src/app/sms-opt-in/page.tsx
// Pagina pubblica /sms-opt-in — documentazione verificabile del flusso di consenso SMS
// richiesta dal reviewer TCR (Call to Action verification). Statica, zero JS client.

export const metadata = {
  title: 'SMS Opt-In Disclosure | Mayller Bridal Italian Style',
  description:
    'How customers opt in to SMS appointment notifications from Mayller Bridal Italian Style, including the exact consent language shown at booking.',
}

export default function SmsOptInPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-white/80">
      <p className="text-amber-300/60 text-xs tracking-[0.35em] uppercase mb-4">Mayller Bridal Italian Style</p>
      <h1 className="text-4xl font-light text-white tracking-widest mb-2">SMS Opt-In Disclosure</h1>
      <p className="text-white/40 text-sm mb-12">
        This page documents how customers consent to receive SMS messages from Mayller Bridal Italian Style LLC.
      </p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Program Description</h2>
          <p>
            Mayller Bridal Italian Style LLC sends transactional appointment notifications only: booking
            confirmations, reschedule notifications, and cancellation notifications. We do not send
            marketing or promotional SMS. Message frequency varies based on appointment activity.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Where Customers Opt In</h2>
          <p className="mb-3">
            Customers opt in while booking an appointment on our website:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-white/70">
            <li>
              Go to{' '}
              <a href="/#appointment" className="text-amber-300/70 underline">
                mayllerbridal.com - Book Your Appointment
              </a>{' '}
              and choose a service (Step 1).
            </li>
            <li>Choose a date and time (Step 2).</li>
            <li>
              In Step 3 (&quot;Details&quot;), the customer enters their name, email, and mobile phone
              number. Below the phone field there is an <strong className="text-white">optional,
              unchecked-by-default checkbox</strong>. Checking it is the sole opt-in action. SMS consent
              is <strong className="text-white">not</strong> required to complete a booking.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Exact Consent Language</h2>
          <p className="mb-4">
            This is the exact checkbox shown in Step 3 of the booking form:
          </p>
          <div className="border border-white/15 bg-white/[0.02] p-6">
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-1 inline-block w-4 h-4 border border-white/40 flex-shrink-0" />
              <span className="text-xs text-white/50 leading-relaxed">
                I agree to receive SMS text messages from Mayller Bridal about my appointment
                (confirmations, reschedules, cancellations). Message and data rates may apply. Reply STOP
                to opt out. See our{' '}
                <a href="/privacy" className="text-amber-300/70 underline">Privacy Policy</a> and{' '}
                <a href="/terms" className="text-amber-300/70 underline">Terms</a>.
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Sample Messages</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li>
              &quot;Your appointment is confirmed! Type: Wedding Consultation. Date: Saturday, May 24,
              2026. Time: 11:00 AM. Location: 4054 W Penn Ave, Sinking Spring, PA 19608. Booking ID:
              A1B2C3D4. Questions? Call (484) 760-0475.&quot;
            </li>
            <li>
              &quot;Your appointment has been successfully cancelled. We hope to see you at Mayller
              Bridal Italian Style soon! Call us at (484) 760-0475 whenever you are ready to rebook.
              Thank you!&quot;
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Opt-Out and Help</h2>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li>Reply STOP at any time to opt out. A final confirmation message will be sent, then no further texts.</li>
            <li>Reply HELP for help, or contact us at (484) 760-0475.</li>
            <li>Message and data rates may apply. Carriers are not liable for delayed or undelivered messages.</li>
            <li>Consent is not a condition of any purchase or service.</li>
            <li>No mobile information is shared with third parties or affiliates for marketing or promotional purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Policies</h2>
          <p className="text-white/70">
            Privacy Policy:{' '}
            <a href="/privacy" className="text-amber-300/70 underline">https://mayllerbridal.com/privacy</a>
            <br />
            Terms &amp; Conditions:{' '}
            <a href="/terms" className="text-amber-300/70 underline">https://mayllerbridal.com/terms</a>
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
