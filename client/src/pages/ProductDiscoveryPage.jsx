import { Discovery } from './StudioWorkspaces';

export default function ProductDiscoveryPage({ onSelect, demoMode, onProductAction }) {
  return <Discovery onSelect={onSelect} demoMode={demoMode} onProductAction={onProductAction} />;
}

