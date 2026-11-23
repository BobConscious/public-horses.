import { useEffect } from 'react';
import { Button } from './components/controls.jsx';
import './about.css';

function GardenScene({ id, image, alt, first = false, children }) {
  const asset = '/art/about-' + image;
  return (
    <section className="about-scene" aria-labelledby={id}>
      <div className="about-scene__art">
        <img src={asset + '.webp'} srcSet={`${asset}-840.webp 840w, ${asset}.webp 1536w`} sizes="100vw"
          alt={alt} loading={first ? 'eager' : 'lazy'}
          fetchPriority={first ? 'high' : undefined} decoding="async" />
      </div>
      <div className="about-scene__layout container">
        <div className="about-scene__copy">{children}</div>
      </div>
    </section>
  );
}

export function AboutPage() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'About | Public Horses';
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <div className="about-page">
      <GardenScene id="about-heading" image="flower-path"
        alt="A gravel path curves between banks of late-summer flowers." first>
        <h1 id="about-heading">About <span>Public Horses</span></h1>
        <p>In the Public Horse story, a village pooled money for a horse anyone could use.</p>
        <p>Geshe Michael Roach uses that story to teach a way of life. We can spend our lives serving others, one act at a time.</p>
        <Button href="/#projects">Find a way to serve</Button>
      </GardenScene>
      <GardenScene id="about-give" image="garden-pond"
        alt="Irises and daylilies edge a garden pond beside the path.">
        <h2 id="about-give">A board for service</h2>
        <p>Find a specific request and respond directly to the organizer. You can offer time, skills, supplies, or money.</p>
        <p>Need help with work that serves others? Post a service opportunity as a person or an organization.</p>
        <Button variant="outline" href="/workspace">Post a service opportunity</Button>
      </GardenScene>
      <GardenScene id="about-garden" image="horse-meadow"
        alt="A bay horse and a gray horse graze beyond a garden fence.">
        <h2 id="about-garden">Why a garden?</h2>
        <p>Karmic correlations are patterns you notice between the help you give and what you experience later.</p>
        <p>Record what you did and what you want to cultivate. Tend a seed in your private garden. Come back to record what you notice.</p>
        <Button variant="outline" href="/garden">My garden</Button>
      </GardenScene>
    </div>
  );
}
