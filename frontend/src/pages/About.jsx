import PageHeader from "../components/PageHeader";
import NexaOpsLogo from "../components/NexaOpsLogo";

function About() {
  return (
    <>
      <PageHeader title="About NexaOps" buttonLabel="Add Product" />
      <main className="min-h-screen bg-background pb-24 text-on-surface md:pb-12">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12">
          <section className="rounded-2xl border border-outline-variant/60 bg-surface-container/70 p-8 shadow-[0_16px_45px_rgba(50,35,75,0.10)] backdrop-blur-xl">
            <NexaOpsLogo size="lg" subtitle="E-Commerce Operating System" />
            <h1 className="mt-6 font-headline-lg text-3xl tracking-tight text-on-surface">
              Engineered for High-Value Commerce
            </h1>
            <p className="mt-3 max-w-2xl text-body-base text-on-surface-variant">
              NexaOps unifies inventory management, curated collections, media
              assets, and insured order fulfillment into a single precision
              command center.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

export default About;
