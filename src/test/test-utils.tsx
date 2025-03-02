import { render as rtlRender } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RecordingProvider } from '../context/RecordingContext';

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
