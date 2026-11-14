import { Goals } from './StudioWorkspaces';

export default function GoalRecoveryPage({ target, onEdit, onNavigate }) {
  return <Goals target={target} onEdit={onEdit} onNavigate={onNavigate} recovery />;
}

