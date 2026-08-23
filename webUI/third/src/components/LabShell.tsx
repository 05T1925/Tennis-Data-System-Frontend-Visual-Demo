import { NavLink } from 'react-router-dom';
import { demoMatchFixture, formatDurationMs } from '@tennis-ui/core';
import type { ReactNode } from 'react';

export function LabShell({ children }: { children: ReactNode }) {
  return (
    <div className="lab-shell">
      <header className="lab-bar">
        <div>
          <b>MPL</b>
          <span>/ SESSION 01</span>
        </div>
        <span>DEMO MATCH</span>
        <span>ANALYSIS READY</span>
        <time>{formatDurationMs(demoMatchFixture.video.durationMs)}</time>
      </header>
      <nav className="lab-nav" aria-label="性能实验室导航">
        <NavLink to={`/video/${demoMatchFixture.video.uploadId}`}>VIDEO</NavLink>
        <NavLink to="/overview">OVERVIEW</NavLink>
        <NavLink to="/rally">SHOT / RALLY</NavLink>
        <NavLink to="/serve">SERVE</NavLink>
      </nav>
      <main>{children}</main>
    </div>
  );
}
