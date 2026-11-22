import { ArrowLeft } from 'lucide-react';
import { ProjectCards } from './catalog.jsx';
import { LoadState, officialUrl, profileKindName, useLoad } from './ui.jsx';

export function ProfilePage({ slug }) {
  const load = useLoad(`/profiles/${encodeURIComponent(slug)}`);
  const { profile, projects = [] } = load.data ?? {};
  const website = officialUrl(profile?.websiteUrl);

  return (
    <div className="profile-page container">
      <a className="back-link" href="/#projects"><ArrowLeft size={17} aria-hidden="true" /> All projects</a>
      {!profile ? <LoadState state={load} /> : (
        <>
          <header className="profile-header">
            <p className="profile-kind">{profileKindName(profile.kind)}</p>
            <h1>{profile.name}</h1>
            {profile.demo && <p className="project-example">Preview profile</p>}
            {profile.location && <p>{profile.location}</p>}
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            {website && <a className="button button-outline" href={website} target="_blank" rel="noopener noreferrer">Visit website</a>}
          </header>
          <section className="profile-projects" aria-labelledby="profile-projects-title">
            <h2 id="profile-projects-title">Open listings</h2>
            {projects.length ? <ProjectCards projects={projects} heading="h3" /> : <p>This organizer has no open listings.</p>}
          </section>
        </>
      )}
    </div>
  );
}
