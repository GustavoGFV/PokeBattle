import { fetchFutureReleases } from '../data/futureReleases.ts'
import { UPDATES } from '../data/updates.ts'
import { getLanguage, t } from '../utils/i18n.ts'
import { renderGithubLink } from './AboutTab.ts'

/** Updates view: data-driven patch notes (src/data/updates.ts), newest first. */
export class UpdatesTab {
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  render(): void {
    const entries = UPDATES.map(
      (entry, index) => `
        <article class="about-card${index === 0 ? ' about-card--highlight' : ''}">
          <div class="about-card-header">
            <span class="about-card-icon" aria-hidden="true">📦</span>
            <h3>v${entry.version} · ${t(entry.titleKey)}</h3>
            ${index === 0 ? `<span class="about-badge about-badge--gold">${t('updates.latest')}</span>` : ''}
          </div>
          <p class="updates-date">${entry.date}</p>
          <ul class="updates-list">${entry.itemKeys.map((key) => `<li>${t(key)}</li>`).join('')}</ul>
        </article>`,
    ).join('')

    this.container.innerHTML = `
      <section class="about-section" id="updates-section" aria-labelledby="updates-heading">
        <div class="menu-section-heading">
          <div>
            <span class="section-kicker">${t('updates.kicker')}</span>
            <h2 id="updates-heading">${t('updates.title')}</h2>
          </div>
        </div>
        <div class="about-grid">
          <article class="about-card" id="future-releases-card">
            <div class="about-card-header"><span class="about-card-icon" aria-hidden="true">🚀</span><h3>${t('updates.futureTitle')}</h3></div>
            <div class="future-body" aria-live="polite"><p>${t('updates.futureLoading')}</p></div>
          </article>
          ${entries}
          <article class="about-card about-card--collaboration">
            <div class="about-card-header"><span class="about-card-icon" aria-hidden="true">🤝</span><h3>${t('updates.moreTitle')}</h3></div>
            <p>${t('updates.moreBody')}</p>
            <div class="about-github-callout">${renderGithubLink('github-repo-link github-repo-link--primary')}</div>
          </article>
        </div>
      </section>
    `
    void this.loadFuture()
  }

  private async loadFuture(): Promise<void> {
    const body = this.container.querySelector<HTMLElement>('.future-body')
    if (!body) return
    try {
      const items = await fetchFutureReleases(getLanguage())
      if (!body.isConnected) return
      body.innerHTML = items.length
        ? `<ul class="updates-list">${items
            .map((i) => `<li><strong>${escapeHtml(i.title)}</strong>${i.eta ? ` <span class="updates-date">· ${escapeHtml(i.eta)}</span>` : ''}${i.description ? `<br>${escapeHtml(i.description)}` : ''}</li>`)
            .join('')}</ul>`
        : `<p>${t('updates.futureEmpty')}</p>`
    } catch {
      if (body.isConnected) body.innerHTML = `<p>${t('updates.futureError')}</p>`
    }
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}
