import { GITHUB_PROFILE_URL } from '../data/constants.ts'
import { CONTRIBUTORS } from '../data/contributors.ts'
import { t } from '../utils/i18n.ts'
import { GITHUB_REPO_URL, getGithubIconSvg } from './AboutTab.ts'

const SPRITECOLLAB_URL = 'https://sprites.pmdcollab.org/'
const DEVELOPER_URL = GITHUB_PROFILE_URL

/** Credits view: developer, asset sources, tooling and legal attribution. */
export class CreditsTab {
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  render(): void {
    this.container.innerHTML = `
      <section class="about-section" id="credits-section" aria-labelledby="credits-heading">
        <div class="menu-section-heading">
          <div>
            <span class="section-kicker">${t('credits.kicker')}</span>
            <h2 id="credits-heading">${t('credits.title')}</h2>
          </div>
        </div>
        <div class="about-grid">
          <article class="about-card about-card--highlight">
            <div class="about-card-header"><span class="about-card-icon" aria-hidden="true">💻</span><h3>${t('credits.devTitle')}</h3></div>
            <p>${t('credits.devBody')}</p>
            <div class="about-link-row">
              <a href="${DEVELOPER_URL}" target="_blank" rel="noopener noreferrer" class="about-external-btn">${getGithubIconSvg(16)}<span>${t('credits.devLink')}</span><span aria-hidden="true">↗</span></a>
              <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" class="about-external-btn"><span>Poke-Battle</span><span aria-hidden="true">↗</span></a>
            </div>
          </article>
          <article class="about-card">
            <div class="about-card-header"><span class="about-card-icon" aria-hidden="true">🎨</span><h3>${t('credits.spritesTitle')}</h3></div>
            <p>${t('credits.spritesBody')}</p>
            <div class="about-link-row"><a href="${SPRITECOLLAB_URL}" target="_blank" rel="noopener noreferrer" class="about-external-btn"><span>${t('credits.spritesLink')}</span><span aria-hidden="true">↗</span></a></div>
          </article>
          <article class="about-card">
            <div class="about-card-header"><span class="about-card-icon" aria-hidden="true">🎬</span><h3>${t('credits.inspirationTitle')}</h3></div>
            <p>${t('credits.inspirationBody')}</p>
          </article>
          <article class="about-card">
            <div class="about-card-header"><span class="about-card-icon" aria-hidden="true">🛠️</span><h3>${t('credits.toolsTitle')}</h3></div>
            <p>${t('credits.toolsBody')}</p>
          </article>
          <article class="about-card">
            <div class="about-card-header"><span class="about-card-icon" aria-hidden="true">👥</span><h3>${t('credits.contributorsTitle')}</h3></div>
            <p>${t('credits.contributorsBody')}</p>
            <ul class="contributors-list">${CONTRIBUTORS.map(
              (c) => `<li><a href="${GITHUB_PROFILE_URL}/${encodeURIComponent(c.github)}" target="_blank" rel="noopener noreferrer">${getGithubIconSvg(14)}<strong>${c.name}</strong></a><span>${t(c.roleKey)}</span></li>`,
            ).join('')}</ul>
          </article>
          <div class="about-disclaimer"><p><strong>${t('credits.legalTitle')}:</strong> ${t('credits.legalBody')}</p></div>
        </div>
      </section>
    `
  }
}
