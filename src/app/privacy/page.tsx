import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Citipilot',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F3F0EB] px-5 py-10 text-[#14121A]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-bold text-[#C44B2F] underline">← Back to Citipilot</Link>
        <h1 className="mt-6 text-4xl font-extrabold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#5A5560]">Last updated: July 8, 2026</p>

        <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-[#5A5560]">
          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Who we are</h2>
            <p className="mt-2 leading-relaxed">
              Citipilot (&quot;we&quot;, &quot;us&quot;) operates a local discovery platform for Richmond, Virginia.
              We help people find events, places, and community activity through our website and mobile app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Information we collect</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 leading-relaxed">
              <li>Account information such as email address when you sign in or submit an event.</li>
              <li>Preferences you set, including neighborhoods and vibes.</li>
              <li>Event submissions and organizer contact details.</li>
              <li>Payment information processed by Stripe when you purchase featured placement or tickets.</li>
              <li>Usage data such as pages viewed and saved events.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">How we use information</h2>
            <p className="mt-2 leading-relaxed">
              We use your information to personalize event discovery, process organizer payments and ticket sales,
              send optional weekly digests, improve the product, and provide customer support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Third-party services</h2>
            <p className="mt-2 leading-relaxed">
              We use Supabase for authentication and data storage, Stripe for payments, and Resend for email delivery.
              These providers process data according to their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Contact</h2>
            <p className="mt-2 leading-relaxed">
              Questions about this policy: <a href="mailto:hello@citipilot.app" className="text-[#C44B2F] underline">hello@citipilot.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
