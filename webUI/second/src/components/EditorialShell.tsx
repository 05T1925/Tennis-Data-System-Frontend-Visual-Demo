import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { demoMatchFixture } from '@tennis-ui/core';
const links: [string, string][] = [
  ['/video/demo-upload-001', '视频详情'],
  ['/overview', '数据总览'],
  ['/rally', '击球与相持'],
  ['/serve', '发球分析'],
];
export function EditorialShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="masthead">
        <b>COURT / EDITION</b>
        <span>{demoMatchFixture.video.title}</span>
        <small>MOCK · {demoMatchFixture.video.algorithmVersion}</small>
      </header>
      <nav className="topnav" aria-label="Second 页面导航">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main>{children}</main>
    </>
  );
}
