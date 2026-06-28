import { render, screen } from '@testing-library/react';
import { TopBar } from './TopBar';

describe('TopBar', () => {
  it('renders the symbol', () => {
    render(<TopBar symbol="SPY" quote={null} isLive={false} />);
    expect(screen.getByText('SPY')).toBeInTheDocument();
  });

  it('renders formatted price and positive change', () => {
    render(
      <TopBar
        symbol="SPY"
        quote={{ price: 1234.5, change: 12.34, changePercent: 1.01 }}
        isLive
      />,
    );
    expect(screen.getByText('$1,234.50')).toBeInTheDocument();
    expect(screen.getByText(/\+12\.34/)).toBeInTheDocument();
    expect(screen.getByText(/\+1\.01%/)).toBeInTheDocument();
  });

  it('shows a LIVE badge when streaming', () => {
    render(<TopBar symbol="SPY" quote={null} isLive />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('shows OFFLINE when not streaming', () => {
    render(<TopBar symbol="SPY" quote={null} isLive={false} />);
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
  });

  it('hides price when there is no quote', () => {
    render(<TopBar symbol="SPY" quote={null} isLive={false} />);
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });
});
