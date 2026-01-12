import { useLocation } from 'react-router-dom';

interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    '@type': string;
    telephone: string;
    contactType: string;
  };
  sameAs?: string[];
}

interface CourseSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  provider: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    priceCurrency: string;
    price: string;
    availability: string;
  };
}

interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: {
    '@type': string;
    name: string;
  };
  publisher?: {
    '@type': string;
    name: string;
    logo?: {
      '@type': string;
      url: string;
    };
  };
}

interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

interface StructuredDataProps {
  type: 'organization' | 'course' | 'article' | 'breadcrumb';
  data: OrganizationSchema | CourseSchema | ArticleSchema | BreadcrumbSchema;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Хелперы для создания схем
export const createOrganizationSchema = (baseUrl: string): OrganizationSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NailArt Academy',
  url: baseUrl,
  logo: `${baseUrl}/favicon.svg`,
  description: 'Онлайн-школа маникюра для начинающих и профессионалов',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+7-XXX-XXX-XX-XX', // Замените на реальный телефон
    contactType: 'customer service',
  },
  sameAs: [
    'https://www.instagram.com/nailartacademy', // Добавьте реальные ссылки
    'https://www.facebook.com/nailartacademy',
  ],
});

export const createCourseSchema = (
  course: {
    title: string;
    description: string;
    price?: number;
    currency?: string;
  },
  baseUrl: string
): CourseSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: course.title,
  description: course.description,
  provider: {
    '@type': 'Organization',
    name: 'NailArt Academy',
  },
  ...(course.price && {
    offers: {
      '@type': 'Offer',
      priceCurrency: course.currency || 'EUR',
      price: course.price.toString(),
      availability: 'https://schema.org/InStock',
    },
  }),
});

export const createArticleSchema = (
  article: {
    title: string;
    description: string;
    image?: string;
    datePublished?: string;
    dateModified?: string;
    author?: string;
  },
  baseUrl: string
): ArticleSchema => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  ...(article.image && { image: article.image }),
  ...(article.datePublished && { datePublished: article.datePublished }),
  ...(article.dateModified && { dateModified: article.dateModified }),
  ...(article.author && {
    author: {
      '@type': 'Person',
      name: article.author,
    },
  }),
  publisher: {
    '@type': 'Organization',
    name: 'NailArt Academy',
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/favicon.svg`,
    },
  },
});

export const createBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
): BreadcrumbSchema => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
