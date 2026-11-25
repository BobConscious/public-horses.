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
        <p>In the Public Horse story, neighbors in an Asian village pooled their money to buy a horse. Anyone in the village could use it when they needed help.</p>
        <p>Geshe Michael Roach uses that story to teach a way of life. For yogis, becoming a public horse means spending our lives serving others.</p>
        <Button href="/#projects">Find a way to serve</Button>
      </GardenScene>
      <GardenScene id="about-give" image="garden-pond"
        alt="Irises and daylilies edge a garden pond beside the path.">
        <h2 id="about-give">A service board</h2>
        <p>A person or organization posts a specific way to help. Another person fulfills the request by giving the help it asks for.</p>
        <p>Respond directly to the organizer. Offer time, skills, supplies, or money. You can post one opportunity and serve on another with the same account.</p>
        <Button variant="outline" href="/workspace">Post a service opportunity</Button>
      </GardenScene>
      <GardenScene id="about-garden" image="horse-meadow"
        alt="A bay horse and a gray horse graze beyond a garden fence.">
        <h2 id="about-garden">Why a garden?</h2>
        <p>We become gardeners of our own minds. Each act of service plants a karmic seed for the world we want to be part of.</p>
        <p>When you water a seed, first remember emptiness. Then rejoice in the good you did. Use your private journal to reflect on what you notice over time.</p>
        <Button variant="outline" href="/garden">My garden</Button>
      </GardenScene>
    </div>
  );
}
