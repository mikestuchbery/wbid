import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POIMarker } from './POIMarker';
import { NearbyLandmark } from '../types';

describe('POIMarker', () => {
  const mockOnCollect = vi.fn();

  const defaultProps = {
    landmark: {
      name: 'Eiffel Tower',
      lat: 48.8584,
      lng: 2.2945,
      bearing: 90,
      distance: 2.5
    } as NearbyLandmark,
    heading: 90, // Exact same as bearing -> difference 0 -> "isLockedOn"
    isSaving: false,
    isCollected: false,
    onCollect: mockOnCollect
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when landmark.bearing is undefined', () => {
    const props = { ...defaultProps, landmark: { ...defaultProps.landmark, bearing: undefined } };
    const { container } = render(<POIMarker {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when landmark is out of the 60 degree field of view (diff > 30)', () => {
    // 90 (bearing) - 125 (heading) = -35 -> out of view
    const props = { ...defaultProps, heading: 125 };
    const { container } = render(<POIMarker {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Target to Collect" when within field of view but not in target cone (> 15 diff)', () => {
    // 90 (bearing) - 110 (heading) = -20 -> diff is 20, > 15 but <= 30
    const props = { ...defaultProps, heading: 110 };
    render(<POIMarker {...props} />);
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText('Target to Collect')).toBeInTheDocument();
  });

  it('renders "Collect Site" when in target cone (<= 15 diff but > 5)', () => {
    // 90 (bearing) - 100 (heading) = -10 -> diff is 10, <= 15 and > 5
    const props = { ...defaultProps, heading: 100 };
    render(<POIMarker {...props} />);
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText('Collect Site')).toBeInTheDocument();
  });

  it('renders correctly when locked on (<= 5 diff)', () => {
    // 90 (bearing) - 93 (heading) = -3 -> diff is 3, <= 5
    const props = { ...defaultProps, heading: 93 };
    render(<POIMarker {...props} />);
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument();
    expect(screen.getByText('Collect Site')).toBeInTheDocument(); // still shows "Collect Site" or similar
    // We can also check styles or classes if needed, e.g. for isLockedOn
  });

  it('calls onCollect when button is clicked and not isSaving', () => {
    const props = { ...defaultProps, heading: 100 };
    render(<POIMarker {...props} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(mockOnCollect).toHaveBeenCalledTimes(1);
    expect(mockOnCollect).toHaveBeenCalledWith(props.landmark);
  });

  it('is disabled and displays "Recording..." when isSaving is true', () => {
    const props = { ...defaultProps, heading: 100, isSaving: true };
    render(<POIMarker {...props} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Recording...')).toBeInTheDocument();
  });

  it('displays "Discovered" when isCollected is true', () => {
    const props = { ...defaultProps, heading: 100, isCollected: true };
    render(<POIMarker {...props} />);
    expect(screen.getByText('Discovered')).toBeInTheDocument();
  });

  it('displays distance correctly for >= 1km (in km)', () => {
    const props = { ...defaultProps, heading: 90 }; // default distance is 2.5
    render(<POIMarker {...props} />);
    expect(screen.getByText('2.5km')).toBeInTheDocument();
  });

  it('displays distance correctly for < 1km (in meters)', () => {
    const props = {
      ...defaultProps,
      landmark: { ...defaultProps.landmark, distance: 0.75 },
      heading: 90
    };
    render(<POIMarker {...props} />);
    expect(screen.getByText('750m')).toBeInTheDocument();
  });
});
