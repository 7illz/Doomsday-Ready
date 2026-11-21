import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, type BookingQuote, type Cinema } from '../api/client';
import { BookingPage } from './BookingPage';

vi.mock('../api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../api/client')>();
  return {
    ...original,
    api: {
      ...original.api,
      getCinemas: vi.fn(),
      createCinema: vi.fn(),
      getBookingQuote: vi.fn(),
    },
  };
});

const cinemas: Cinema[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Cinema A',
    bundleSizes: [1, 3, 4],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Cinema B',
    bundleSizes: [2, 5],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Cinema C',
    bundleSizes: [6, 9, 20],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Cinema D',
    bundleSizes: [4, 6],
  },
];

async function requestQuote(cinema: Cinema, groupSize: number) {
  fireEvent.change(await screen.findByLabelText('Cinema'), {
    target: { value: cinema.id },
  });
  fireEvent.change(screen.getByLabelText('Group size'), {
    target: { value: String(groupSize) },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Find Optimal Bundles' }));
}

describe('BookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCinemas).mockResolvedValue(cinemas);
  });

  it.each([
    {
      cinema: cinemas[0],
      groupSize: 6,
      totalBundles: 2,
      bundles: [{ size: 3, quantity: 2 }],
    },
    {
      cinema: cinemas[1],
      groupSize: 11,
      totalBundles: 4,
      bundles: [
        { size: 5, quantity: 1 },
        { size: 2, quantity: 3 },
      ],
    },
    {
      cinema: cinemas[2],
      groupSize: 44,
      totalBundles: 4,
      bundles: [
        { size: 20, quantity: 1 },
        { size: 9, quantity: 2 },
        { size: 6, quantity: 1 },
      ],
    },
  ])(
    'shows the optimal quote for $cinema.name and group $groupSize',
    async ({ cinema, groupSize, totalBundles, bundles }) => {
      const quote: BookingQuote = {
        cinema,
        groupSize,
        possible: true,
        totalBundles,
        bundles,
      };
      vi.mocked(api.getBookingQuote).mockResolvedValue(quote);
      render(<BookingPage />);

      await requestQuote(cinema, groupSize);

      expect(await screen.findByText('Exact combination found')).toBeInTheDocument();
      expect(api.getBookingQuote).toHaveBeenCalledWith(cinema.id, groupSize);
      expect(screen.getByText('Minimum bundles').nextElementSibling).toHaveTextContent(
        String(totalBundles),
      );
      expect(screen.getByText('Total seats').nextElementSibling).toHaveTextContent(
        String(groupSize),
      );
      for (const bundle of bundles) {
        const bundleRow = screen.getByText(`${bundle.size}-seat bundle`).parentElement;
        expect(bundleRow).not.toBeNull();
        expect(within(bundleRow!).getByText(`× ${bundle.quantity}`)).toBeInTheDocument();
      }
    },
  );

  it('shows the impossible result for Cinema D and group 7', async () => {
    vi.mocked(api.getBookingQuote).mockResolvedValue({
      cinema: cinemas[3],
      groupSize: 7,
      possible: false,
      totalBundles: null,
      bundles: [],
    });
    render(<BookingPage />);

    await requestQuote(cinemas[3], 7);

    expect(
      await screen.findByText(
        'No exact bundle combination is available for this group size.',
      ),
    ).toBeInTheDocument();
    expect(api.getBookingQuote).toHaveBeenCalledWith(cinemas[3].id, 7);
  });

  it('creates a cinema, refreshes the list, and selects it', async () => {
    const createdCinema: Cinema = {
      id: '55555555-5555-4555-8555-555555555555',
      name: 'Cinema E',
      bundleSizes: [2, 5],
    };
    vi.mocked(api.createCinema).mockResolvedValue(createdCinema);
    vi.mocked(api.getCinemas)
      .mockResolvedValueOnce(cinemas)
      .mockResolvedValueOnce([...cinemas, createdCinema]);
    render(<BookingPage />);
    await screen.findByLabelText('Cinema');

    fireEvent.click(screen.getByRole('button', { name: 'Add cinema' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Cinema name'), {
      target: { value: 'Cinema E' },
    });
    fireEvent.change(within(dialog).getByLabelText('Bundle size 1'), {
      target: { value: '2' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add size' }));
    fireEvent.change(within(dialog).getByLabelText('Bundle size 2'), {
      target: { value: '5' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create cinema' }));

    await waitFor(() => {
      expect(api.createCinema).toHaveBeenCalledWith({
        name: 'Cinema E',
        bundleSizes: [2, 5],
      });
      expect(screen.getByLabelText('Cinema')).toHaveValue(createdCinema.id);
    });
    expect(api.getCinemas).toHaveBeenCalledTimes(2);
  });

  it('rejects duplicate bundle sizes before calling the API', async () => {
    render(<BookingPage />);
    await screen.findByLabelText('Cinema');

    fireEvent.click(screen.getByRole('button', { name: 'Add cinema' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Cinema name'), {
      target: { value: 'Cinema E' },
    });
    fireEvent.change(within(dialog).getByLabelText('Bundle size 1'), {
      target: { value: '2' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add size' }));
    fireEvent.change(within(dialog).getByLabelText('Bundle size 2'), {
      target: { value: '2' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create cinema' }));

    expect(await within(dialog).findByText('Bundle sizes must be distinct.')).toBeInTheDocument();
    expect(api.createCinema).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range group size before requesting a quote', async () => {
    render(<BookingPage />);
    fireEvent.change(await screen.findByLabelText('Cinema'), {
      target: { value: cinemas[0].id },
    });
    fireEvent.change(screen.getByLabelText('Group size'), {
      target: { value: '10001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Find Optimal Bundles' }));

    expect(
      await screen.findByText('Group size must be between 1 and 10,000.'),
    ).toBeInTheDocument();
    expect(api.getBookingQuote).not.toHaveBeenCalled();
  });
});
