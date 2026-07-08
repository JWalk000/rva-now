import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — RVA Now',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F3F0EB] px-5 py-10 text-[#14121A]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm font-bold text-[#C44B2F] underline">← Back to RVA Now</Link>
        <h1 className="mt-6 text-4xl font-extrabold">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#5A5560]">Last updated: July 8, 2026</p>

        <div className="mt-8 space-y-6 text-[#5A5560]">
          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Service</h2>
            <p className="mt-2 leading-relaxed">
              RVA Now provides a platform for discovering local events and places in Richmond, Virginia.
              Organizers may submit listings and purchase featured placement or ticketing services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Payments</h2>
            <p className="mt-2 leading-relaxed">
              Paid listings and ticket purchases are processed by Stripe. By making a purchase, you agree to
              Stripe&apos;s terms and authorize charges for the selected product or ticket.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Organizer listings</h2>
            <p className="mt-2 leading-relaxed">
              Organizers are responsible for the accuracy of event information, compliance with local laws,
              and fulfillment of tickets sold through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold text-[#14121A]">Contact</h2>
            <p className="mt-2 leading-relaxed">
              Support: <a href="mailto:hello@rva-now.app" className="text-[#C44B2F] underline">hello@rva-now.app</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
