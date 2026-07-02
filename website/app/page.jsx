import AppScript from "./AppScript.jsx";

export const metadata = {
  title: "Eismark World Handbook",
};

export default function Page() {
  return (
    <>
      <header className="topbar wiki-topbar">
        <a className="site-mark" href="#/home">Eismark<span>Wiki</span></a>
        <nav className="history-nav" aria-label="Page history">
          <button id="historyBack" className="history-button" type="button" title="Previous visited page">←</button>
          <button id="historyForward" className="history-button" type="button" title="Next visited page">→</button>
        </nav>
        <form id="searchForm" className="top-search">
          <input id="searchInput" className="search-input" type="search" placeholder="Search EismarkWiki" />
          <button className="button search-button" type="submit">Search</button>
          <div id="searchSuggestions" className="search-suggestions hidden"></div>
        </form>
        <div id="gmAccess" className="gm-access hidden">
          <button id="gmStatusButton" className="gm-status-button" type="button" aria-haspopup="menu" aria-expanded="false">GM/Editor</button>
          <div id="gmQuickMenu" className="gm-quick-menu hidden" role="menu" aria-label="GM/Editor menu">
            <button id="editCurrentEntryButton" type="button" role="menuitem">Open Entry Controls</button>
            <button id="lockGmButton" type="button" role="menuitem">Exit GM/Editor</button>
          </div>
        </div>
      </header>

      <main className="wiki-shell">
        <aside className="sidebar" aria-label="Library navigation">
          <section className="panel saved-panel">
            <h2>Saved Pages</h2>
            <div id="savedList" className="section-list saved-list"></div>
            <select id="savedSelect" className="saved-select hidden" aria-label="Saved pages"></select>
          </section>

          <section className="panel">
            <h2>Chapters</h2>
            <div id="chapterList" className="section-list chapter-list"></div>
          </section>
        </aside>

        <section className="content-area wiki-page">
          <div id="toolbar" className="toolbar">
            <div>
              <p id="activeDoc" className="active-doc">Main Page</p>
              <h2 id="activeTitle">Eismark</h2>
            </div>
            <div id="resultCount" className="result-count"></div>
          </div>

          <div id="homePage" className="home-page"></div>
          <div id="entryGrid" className="entry-grid"></div>
          <article id="entryDetail" className="entry-detail hidden"></article>
        </section>
      </main>

      <dialog id="gmDialog" className="gm-dialog">
        <form method="dialog" id="gmForm">
          <h2>GM/Editor Unlock</h2>
          <p>Sign in to GM/Editor mode to reveal restricted material and edit local handbook files.</p>
          <label htmlFor="gmPassword">Password</label>
          <input id="gmPassword" type="password" autoComplete="current-password" />
          <p id="gmError" className="gm-error"></p>
          <div className="dialog-actions">
            <button className="button secondary" value="cancel" type="submit">Cancel</button>
            <button id="unlockButton" className="button" value="default" type="button">Unlock</button>
          </div>
        </form>
      </dialog>

      <AppScript />
    </>
  );
}
