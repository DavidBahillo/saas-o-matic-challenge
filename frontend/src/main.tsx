// Arranque (D-P16): aplica el tema antes de renderizar.
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { createQueryClient } from './api/query-client';
import { applyTheme, browserStorage, readTheme } from './lib/theme';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/controls.css';
import './styles/lists.css';
import './styles/workspace.css';
import './styles/simulator.css';
import './styles/pagination.css';
import './styles/dialog.css';

applyTheme(document.documentElement, readTheme(browserStorage()));

const root = document.getElementById('root');
if (root !== null) {
  createRoot(root).render(
    <QueryClientProvider client={createQueryClient()}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}
