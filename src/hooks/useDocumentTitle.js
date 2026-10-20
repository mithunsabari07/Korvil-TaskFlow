import { useEffect } from 'react';

/**
 * Custom hook to set document title and meta description dynamically on route changes.
 * Also configures indexing controls (noindex for private authenticated routes).
 *
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {boolean} [isPrivate=true] - If true, adds noindex to safeguard private app data
 */
export function useDocumentTitle(title, description, isPrivate = true) {
  useEffect(() => {
    // 1. Update Document Title
    const brand = 'Korvil TaskFlow';
    const fullTitle = title ? `${title} — ${brand}` : brand;
    document.title = fullTitle;

    // 2. Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    const defaultDesc = 'Korvil TaskFlow — Smart task management, personal to-dos, and secure work deliverable review for teams.';
    metaDescription.setAttribute('content', description || defaultDesc);

    // 3. Update Robots Meta for Privacy
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    // Prevent search engines from indexing private authenticated corporate pages
    metaRobots.setAttribute('content', isPrivate ? 'noindex, nofollow' : 'index, follow');

    // Scroll to top on page navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [title, description, isPrivate]);
}

export default useDocumentTitle;
