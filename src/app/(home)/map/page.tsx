import type { Metadata } from 'next';
import { AlgorithmMap } from '@/components/map/AlgorithmMap';

export const metadata: Metadata = {
  title: 'The Map of RL',
  description:
    'A curated interactive map of reinforcement learning methods, their lineage, and a pathfinder that narrows the field to your problem.',
  openGraph: {
    title: 'The Map of RL',
    description:
      'A curated interactive map of reinforcement learning methods and how they descend from one another.',
    url: 'https://rl-handbook.com/map',
  },
};

export default function MapPage() {
  return (
    <main className="h-[calc(100dvh-3.5rem)] overflow-hidden">
      <AlgorithmMap />
    </main>
  );
}
