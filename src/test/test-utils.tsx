import { render as rtlRender, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecordingProvider } from '../context/RecordingContext';

export function simulateHistoryNavigation(url: string) {
  act(() => {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
}

function render(ui: React.ReactElement, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return rtlRender(
    <BrowserRouter>
      <RecordingProvider>
        {ui}
      </RecordingProvider>
    </BrowserRouter>
  );
}

export * from '@testing-library/react';
export { render };
