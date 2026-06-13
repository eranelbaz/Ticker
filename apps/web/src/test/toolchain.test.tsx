import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from './server';

it('MSW handler, fetch, and jest-dom all work', async () => {
  server.use(
    http.get('*/ping', () => HttpResponse.json({ ok: true })),
  );

  const res = await fetch(new URL('/ping', window.location.origin).toString());
  const json = await res.json();
  expect(json).toEqual({ ok: true });

  render(<div>hi</div>);
  expect(screen.getByText('hi')).toBeInTheDocument();
});
