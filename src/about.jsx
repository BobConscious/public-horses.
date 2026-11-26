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
        <p>Public Horses is the Buddhist volunteer platform. Where service is a practice.</p>
        <p>In the Public Horse story, neighbors in an Asian village pooled their money to buy a horse. Anyone in the village could use it when they needed help.</p>
        <p>Geshe Michael Roach uses that story to teach a way of life. For yogis, becoming a public horse means spending our lives serving others.</p>
        <Button href="/#projects">Find a way to serve</Button>
      </GardenScene>
      <GardenScene id="about-give" image="garden-pond"
        alt="Irises and daylilies edge a garden pond beside the path.">
        <h2 id="about-give">Find a way to help</h2>
        <p>Browse the list, swipe through cards, or look on the map. Save opportunities to your shortlist. When you’re ready, respond directly to the organizer.</p>
        <p>A person or organization can post a request for time, skills, supplies, or money. You can post opportunities and serve with the same account.</p>
        <Button variant="outline" href="/workspace">Post a service opportunity</Button>
      </GardenScene>
      <GardenScene id="about-garden" image="horse-meadow"
        alt="A bay horse and a gray horse graze beyond a garden fence.">
        <h2 id="about-garden">Tend what you plant</h2>
        <p>Record an act of service to plant a karmic seed in your private garden. Choose what you want to cultivate.</p>
        <p>To water the seed, first remember emptiness. Recall the people and conditions that made the act possible. Then rejoice in the good you and others did.</p>
        <p>Notice how the help you give relates to what you experience over time. Use what you learn to help create the world you want to live in.</p>
        <Button variant="outline" href="/garden">My garden</Button>
      </GardenScene>
    </div>
  );
}
