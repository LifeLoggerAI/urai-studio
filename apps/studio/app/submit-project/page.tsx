import type { Metadata } from 'next';
import { ContactForm } from '../contact/ContactForm';

export const metadata: Metadata = {
  title: 'Submit Project | URAI Studio',
  description: 'Submit a URAI Studio project request for campaign films, launch assets, music visuals, product visuals, content systems, and brand worlds.',
  alternates: { canonical: '/submit-project' },
};

export default function SubmitProjectPage() {
  return (
    <section data-urai-studio-page="submit-project" className="page-stack narrow-page">
      <p className="eyebrow">Submit Project</p>
      <h1>Send the project brief.</h1>
      <p className="hero-lede">Use this route when you are ready to describe the Studio project, timeline, budget range, and deliverables you want reviewed.</p>
      <ContactForm />
    </section>
  );
}
