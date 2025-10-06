import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExpenseCategoryDistribution } from '@/components/ExpenseCategoryDistribution';

describe('ExpenseCategoryDistribution', () => {
  it('renders total amount in the center', () => {
    render(
      <ExpenseCategoryDistribution
        data={[
          { name: 'Food', value: 20 },
          { name: 'Transport', value: 30 },
        ]}
        currencySymbol="€"
      />
    );
    // Total should be €50.00
    expect(screen.getByText('€50.00')).toBeInTheDocument();
  });

  it('renders legend with percentages', () => {
    render(
      <ExpenseCategoryDistribution
        data={[
          { name: 'A', value: 50 },
          { name: 'B', value: 50 },
        ]}
        currencySymbol="€"
      />
    );
    // Two entries should show 50%
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty data gracefully', () => {
    render(<ExpenseCategoryDistribution data={[]} currencySymbol="€" />);
    // Total should be €0.00
    expect(screen.getByText('€0.00')).toBeInTheDocument();
  });
});
