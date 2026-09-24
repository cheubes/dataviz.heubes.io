import type { CollectionEntry } from 'astro:content';
import en from '../i18n/en';
import fr from '../i18n/fr';

// schema.org graph of a visualization page (see "SEO" in
// technical-specifications.md): the visualization itself as a CreativeWork,
// and, when it offers downloads, its prepared files as a Dataset.

const SITE_LICENSE = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';
const AUTHOR = { '@type': 'Person', name: 'Christophe Heubès', url: 'https://christophe.heubes.org' };

interface Options {
  viz: CollectionEntry<'visualizations'>;
  slug: string;
  pageUrl: URL;
  coverUrl: URL;
  site: URL;
}

export function buildVisualizationStructuredData({ viz, slug, pageUrl, coverUrl, site }: Options): object {
  const { lang, title, summary, datasets, themes, downloads } = viz.data;
  const common = lang === 'fr' ? fr : en;
  const homeUrl = new URL(lang === 'fr' ? '/fr/' : '/', site).href;

  const sources = datasets.map((dataset) => ({
    '@type': 'Dataset',
    name: dataset.name,
    url: dataset.url,
    publisher: { '@type': 'Organization', name: dataset.publisher },
    ...(dataset.license && { license: { '@type': 'CreativeWork', name: dataset.license } }),
  }));

  const visualization = {
    '@type': 'CreativeWork',
    '@id': `${pageUrl.href}#visualization`,
    name: title,
    description: summary,
    url: pageUrl.href,
    inLanguage: lang,
    datePublished: viz.data['publication-date'],
    author: AUTHOR,
    image: coverUrl.href,
    license: SITE_LICENSE,
    keywords: themes.map((theme) => common.themes[theme]),
    isPartOf: { '@type': 'WebSite', name: common.site.name, url: homeUrl },
    isBasedOn: sources,
  };

  if (!downloads) return { '@context': 'https://schema.org', '@graph': [visualization] };

  // The prepared files derive from every source, so they stay subject to all
  // of their licenses, as the download block on the page already states.
  const sourceLicenses = [...new Set(datasets.flatMap((dataset) => (dataset.license ? [dataset.license] : [])))];

  const preparedData = {
    '@type': 'Dataset',
    '@id': `${pageUrl.href}#data`,
    name: common.viz.preparedDataName.replace('{title}', title),
    description: summary,
    url: pageUrl.href,
    inLanguage: lang,
    datePublished: viz.data['publication-date'],
    creator: AUTHOR,
    keywords: themes.map((theme) => common.themes[theme]),
    isAccessibleForFree: true,
    isBasedOn: sources,
    license: sourceLicenses.map((name) => ({ '@type': 'CreativeWork', name })),
    distribution: downloads.map((file) => ({
      '@type': 'DataDownload',
      name: file,
      contentUrl: new URL(`/data/${slug}/${file}`, site).href,
      encodingFormat: 'application/json',
    })),
  };

  return { '@context': 'https://schema.org', '@graph': [visualization, preparedData] };
}
