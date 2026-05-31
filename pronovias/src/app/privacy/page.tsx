// Destinazione nel repo: pronovias/src/app/privacy/page.tsx
// Pagina pubblica /privacy — richiesta da TCR per sbloccare l'A2P.

export const metadata = {
  title: 'Privacy Policy | Mayller Bridal Italian Style',
  description: 'Privacy Policy and SMS messaging terms for Mayller Bridal Italian Style.',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-white/80">
      <p className="text-amber-300/60 text-xs tracking-[0.35em] uppercase mb-4">Mayller Bridal Italian Style</p>
      <h1 className="text-4xl font-light text-white tracking-widest mb-2">Privacy Policy</h1>
      <p className="text-white/40 text-sm mb-12">Last updated: May 31, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <p>
          Mayller Bridal Italian Style LLC (&quot;Mayller Bridal,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
          operates the website mayllerbridal.com and provides bridal, tuxedo, alteration, and related
          appointment services. This Privacy Policy explains how we collect, use, and protect your
          information, including information related to our SMS text messaging program.
        </p>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Information We Collect</h2>
          <p>
            When you book an appointment online or by phone, or contact us, we may collect your name,
            phone number, email address, appointment details, and any notes you provide. We use this
            information to schedule, confirm, modify, or cancel your appointment and to communicate with
            you about your appointment.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">SMS Text Messaging</h2>
          <p className="mb-3">
            By providing your mobile phone number and opting in, you agree to receive transactional SMS
            text messages from Mayller Bridal related to your appointment, such as booking confirmations,
            reschedule notifications, and cancellation notifications.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-white/70">
            <li>Message frequency varies based on your appointment activity.</li>
            <li>Message and data rates may apply.</li>
            <li>You can opt out at any time by replying STOP to any message. After you reply STOP, we will send a final confirmation message and will not send further texts unless you opt in again.</li>
            <li>For help, reply HELP or contact us at (484) 760-0475.</li>
            <li>Carriers are not liable for delayed or undelivered messages.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">No Mobile Information Sharing</h2>
          <p>
            No mobile information will be shared with third parties or affiliates for marketing or
            promotional purposes. All other categories of information exclude text messaging originator
            opt-in data and consent; this information will not be shared with any third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">How We Use Your Information</h2>
          <p>
            We use your information solely to provide and manage our services and to communicate with you
            about your appointments. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-light text-white tracking-wide mb-3">Data Retention and Security</h2>
          <p>
            We retain your information only as long as necessary to provide our services and meet legal
            obligations, and we take reasonable measures to protect it.
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
