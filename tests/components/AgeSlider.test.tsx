// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AgeSlider } from '@/components/age/AgeSlider';
import { useAppStore } from '@/state/store';
import { getBundle } from '@/content/bundle';

const bands = getBundle().ageBands;

describe('AgeSlider (P1, §46)', () => {
  beforeEach(() => {
    useAppStore.setState({ age: 40, ageDraft: 40 });
  });

  it('is a native range input, not a div with drag handlers', () => {
    render(<AgeSlider bands={bands} />);
    const slider = screen.getByRole('slider');
    expect(slider.tagName).toBe('INPUT');
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('announces the age in words, including the life phase', () => {
    render(<AgeSlider bands={bands} />);
    // "70" alone tells a screen-reader user nothing about where they are.
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      'Age 40, middle adulthood',
    );
  });

  it('is labelled and described', () => {
    render(<AgeSlider bands={bands} />);
    const slider = screen.getByRole('slider', { name: /age/i });
    expect(slider).toHaveAttribute('aria-describedby');
  });

  /**
   * jsdom does not implement native keyboard stepping on <input type="range">,
   * so arrow / PageUp / Home behaviour is asserted against a real browser in
   * tests/e2e/slider.spec.ts. What is testable here is the contract that makes
   * that native behaviour work at all: correct min, max and step, and a change
   * handler that commits.
   */
  it('exposes the range the native keyboard steps over', () => {
    render(<AgeSlider bands={bands} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('step', '1');
  });

  it('commits a new age when the input changes', async () => {
    render(<AgeSlider bands={bands} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '70' } });
    await waitFor(() => expect(useAppStore.getState().age).toBe(70));
  });

  it('updates the announced text as the age moves into another phase', async () => {
    render(<AgeSlider bands={bands} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '70' } });
    await waitFor(() =>
      expect(screen.getByRole('slider')).toHaveAttribute(
        'aria-valuetext',
        'Age 70, later adulthood',
      ),
    );
  });

  it('marks the top of the range as 100+ rather than implying a ceiling', () => {
    useAppStore.setState({ age: 100, ageDraft: 100 });
    render(<AgeSlider bands={bands} />);
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      expect.stringContaining('100'),
    );
  });

  it('surfaces the sparse-data warning when the age reaches it', () => {
    useAppStore.setState({ age: 95, ageDraft: 95 });
    render(<AgeSlider bands={bands} />);
    expect(screen.getByText(/sparse/i)).toBeInTheDocument();
  });

  it('describes the phase rail to screen readers without relying on colour', () => {
    render(<AgeSlider bands={bands} />);
    // The rail's accessible name enumerates every band and its age span, so a
    // screen-reader user gets the same structure a sighted user reads off the
    // hatch patterns.
    const rail = screen.getByRole('img', { name: /life phases/i });
    expect(rail).toHaveAccessibleName(/Early adulthood, ages 20 to 35/);
    expect(rail).toHaveAccessibleName(/Later adulthood/);

    // And the phase legend is present as text, not conveyed by colour alone.
    expect(screen.getByText('Development')).toBeInTheDocument();
    expect(screen.getByText('Later life')).toBeInTheDocument();
  });
});
