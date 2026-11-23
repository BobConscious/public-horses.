import { useEffect } from 'react';
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
        <p>Find practical ways to help your community. Give time, skills, supplies, or money directly to the people doing the work.</p>
        <a className="button button-primary" href="/#projects">Browse projects</a>
      </GardenScene>
      <GardenScene id="about-give" image="garden-pond"
        alt="Irises and daylilies edge a garden pond beside the path.">
        <h2 id="about-give">How it works</h2>
        <p>Browse projects, volunteer opportunities, and events. Each listing shows what the organizer needs and how to help.</p>
        <p>Have something your community needs help with? Create a personal or organization profile and submit a listing for review.</p>
        <a className="button button-outline" href="/workspace">Start a project</a>
      </GardenScene>
      <GardenScene id="about-garden" image="horse-meadow"
        alt="A bay horse and a gray horse graze beyond a garden fence.">
        <h2 id="about-garden">Why a garden?</h2>
        <p>Public Horses takes its name from a teaching by Geshe Michael about working for others.</p>
        <p>When you record how you helped, you choose an intention and get a seed. Plant and tend it in your private garden.</p>
        <a className="button button-outline" href="/garden">My garden</a>
      </GardenScene>
    </div>
  );
}
