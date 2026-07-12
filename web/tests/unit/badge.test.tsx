import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/kit';

describe('<Badge>', () => {
  it('renders its children', () => {
    render(<Badge tone="green">Active</Badge>);
    expect(screen.getByText('Active')).toBeDefined();
  });
});
