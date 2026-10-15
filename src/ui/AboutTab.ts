/**
 * About Project Tab Component
 * Handles the logic, presentation, and links for the About Project view.
 */

import { t } from '../utils/i18n.ts'
import { GITHUB_REPO_URL } from '../data/constants.ts'

export { GITHUB_REPO_URL }
export const POKEMON_BATTLEGROUNDS_URL = 'https://pokemonbattlegrounds.com'

/**
 * Returns an accessible, crisp GitHub SVG icon.
 */
export function getGithubIconSvg(size: number = 20): string {
  return `
    <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" class="github-icon-svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  `
}

/**
 * Standard clickable GitHub hyperlink pairing the GitHub icon with 'The full project here'.
 */
export function renderGithubLink(className: string = 'github-repo-link'): string {
  return `
    <a href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" class="${className}" aria-label="${t('footer.repoAria')}">
      ${getGithubIconSvg(20)}
      <span>${t('footer.repo')}</span>
    </a>
  `
}

export class AboutTab {
  private container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
  }

  render(): void {
    this.container.innerHTML = this.getHtml()
  }

  getHtml(): string {
    return `
      <section class="about-section" id="about-section" aria-labelledby="about-heading">
        <div class="menu-section-heading">
          <div>
            <span class="section-kicker">${t('about.kicker')}</span>
            <h2 id="about-heading">${t('about.title')}</h2>
          </div>
          <div class="about-badges">
            <span class="about-badge about-badge--green">${t('about.badgeNonCommercial')}</span>
            <span class="about-badge about-badge--blue">${t('about.badgeOpenSource')}</span>
            <span class="about-badge about-badge--gold">${t('about.badgeUpdates')}</span>
          </div>
        </div>

        <div class="about-grid">
          <!-- Non-commercial Notice Card -->
          <article class="about-card about-card--highlight">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">🛡️</span>
              <h3>${t('about.nonCommercialTitle')}</h3>
            </div>
            <p>
              ${t('about.nonCommercialBody')}
            </p>
          </article>

          <!-- Inspiration Card -->
          <article class="about-card">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">🎬</span>
              <h3>${t('about.inspirationTitle')}</h3>
            </div>
            <p>
              ${t('about.inspirationBody')}
            </p>
            <div class="about-link-row">
              <a href="${POKEMON_BATTLEGROUNDS_URL}" target="_blank" rel="noopener noreferrer" class="about-external-btn">
                <span>🌐 pokemonbattlegrounds.com</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </article>

          <!-- Single Developer Story -->
          <article class="about-card about-card--story">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">💡</span>
              <h3>${t('about.storyTitle')}</h3>
            </div>
            <blockquote class="about-developer-note">
              ${t('about.storyBody')}
            </blockquote>
          </article>

          <!-- Continuous Updates & Community Collaboration -->
          <article class="about-card about-card--collaboration">
            <div class="about-card-header">
              <span class="about-card-icon" aria-hidden="true">🤝</span>
              <h3>${t('about.collabTitle')}</h3>
            </div>
            <p>
              ${t('about.collabBody1')}
            </p>
            <p>
              ${t('about.collabBody2')}
            </p>

            <div class="about-github-callout">
              <span class="callout-label">${t('about.joinLabel')}</span>
              ${renderGithubLink('github-repo-link github-repo-link--primary')}
            </div>
          </article>

          <!-- Legal & Attribution Footer Note -->
          <div class="about-disclaimer">
            <p>
              ${t('about.disclaimer')}
            </p>
          </div>
        </div>
      </section>
    `
  }
}

