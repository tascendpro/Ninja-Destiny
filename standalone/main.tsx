import { createRoot } from 'react-dom/client';
import Game from '../src/ui/Game';
import '../src/ui/styles.css';

createRoot(document.getElementById('racine')!).render(<Game />);
