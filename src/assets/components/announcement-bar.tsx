import { useState } from 'react';
import { X } from 'lucide-react';
import './announcement-bar.css';

const DISMISSED_KEY = 'a2w_announcement_dismissed_v1';

interface AnnouncementBarProps {
  text: string;
  onDismiss: () => void;
}

export default function AnnouncementBar({ text, onDismiss }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(() => localStorage.getItem(DISMISSED_KEY) !== 'true');

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
    onDismiss();
  };

  return (
    <div className="announcement-bar" role="region" aria-label="Store announcement">
      <p>{text}</p>
      <button type="button" onClick={dismiss} aria-label="Dismiss announcement">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
