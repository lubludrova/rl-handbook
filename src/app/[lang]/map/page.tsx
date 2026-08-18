import type { Metadata } from 'next';
import { AlgorithmMap } from '@/components/map/AlgorithmMap';
import { getLangFromPath, type UILang } from '@/lib/ui';

interface PageProps {
  params: Promise<{ lang: string }>;
}

const meta: Record<
  UILang,
  { title: string; description: string; ogDescription: string }
> = {
  en: {
    title: 'The Map of RL',
    description:
      'A curated interactive map of reinforcement learning methods, their lineage, and a pathfinder that narrows the field to your problem.',
    ogDescription:
      'A curated interactive map of reinforcement learning methods and how they descend from one another.',
  },
  zh: {
    title: 'RL 图谱',
    description:
      '精选的强化学习方法交互图谱，展示它们之间的谱系，并提供一个能帮你缩小到适用方法的路径查找器。',
    ogDescription:
      '精选的强化学习方法交互图谱，展示各方法如何互相衍生。',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang: langParam } = await params;
  const lang = getLangFromPath('/' + langParam);
  const m = meta[lang];
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.ogDescription,
      url: 'https://rl-handbook.com/map',
    },
  };
}

export default function MapPage() {
  return (
    <main className="h-[calc(100dvh-3.5rem)] overflow-hidden">
      <AlgorithmMap />
    </main>
  );
}
