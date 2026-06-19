import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockProductFindOne, mockReviewFind } = vi.hoisted(() => ({
  mockProductFindOne: vi.fn(),
  mockReviewFind: vi.fn(),
}));

vi.mock('../models/Product.js', () => ({
  default: {
    findOne: mockProductFindOne,
  },
}));

vi.mock('../models/Review.js', () => ({
  default: {
    find: mockReviewFind,
  },
}));

import { updateProductAverageRating } from '../services/reviewService.js';

describe('Review Rating Recalculation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reset rating to 5 if there are no approved reviews', async () => {
    // 1. Arrange review queries to return empty list
    mockReviewFind.mockReturnValue({
      lean: vi.fn().mockResolvedValueOnce([]),
    });

    const mockSave = vi.fn();
    const mockProduct = {
      id: 'PRD-1',
      rating: 3.5,
      save: mockSave,
    };
    mockProductFindOne.mockResolvedValueOnce(mockProduct);

    // 2. Act
    await updateProductAverageRating('PRD-1');

    // 3. Assert
    expect(mockReviewFind).toHaveBeenCalledWith({ productId: 'PRD-1', status: 'approved' });
    expect(mockProductFindOne).toHaveBeenCalledWith({ id: 'PRD-1' });
    expect(mockProduct.rating).toBe(5);
    expect(mockSave).toHaveBeenCalled();
  });

  it('should recalculate rating as mathematical average rounded to 1 decimal place', async () => {
    // 1. Arrange reviews with ratings: 4, 5, 4 (Average: 4.333...)
    mockReviewFind.mockReturnValue({
      lean: vi.fn().mockResolvedValueOnce([
        { rating: 4 },
        { rating: 5 },
        { rating: 4 },
      ]),
    });

    const mockSave = vi.fn();
    const mockProduct = {
      id: 'PRD-1',
      rating: 5,
      save: mockSave,
    };
    mockProductFindOne.mockResolvedValueOnce(mockProduct);

    // 2. Act
    await updateProductAverageRating('PRD-1');

    // 3. Assert
    expect(mockReviewFind).toHaveBeenCalledWith({ productId: 'PRD-1', status: 'approved' });
    expect(mockProduct.rating).toBe(4.3); // 13 / 3 = 4.3333... rounded to 4.3
    expect(mockSave).toHaveBeenCalled();
  });

  it('should handle ratings with decimal rounding up correctly', async () => {
    // 1. Arrange reviews with ratings: 4, 5 (Average: 4.5)
    mockReviewFind.mockReturnValue({
      lean: vi.fn().mockResolvedValueOnce([
        { rating: 4 },
        { rating: 5 },
      ]),
    });

    const mockSave = vi.fn();
    const mockProduct = {
      id: 'PRD-2',
      rating: 1,
      save: mockSave,
    };
    mockProductFindOne.mockResolvedValueOnce(mockProduct);

    // 2. Act
    await updateProductAverageRating('PRD-2');

    // 3. Assert
    expect(mockProduct.rating).toBe(4.5);
    expect(mockSave).toHaveBeenCalled();
  });

  it('should graceful exit if productId is missing or product not found', async () => {
    // 1. Missing productId
    await updateProductAverageRating('');
    expect(mockReviewFind).not.toHaveBeenCalled();

    // 2. Product not found in database
    mockReviewFind.mockReturnValue({
      lean: vi.fn().mockResolvedValueOnce([{ rating: 4 }]),
    });
    mockProductFindOne.mockResolvedValueOnce(null);

    await updateProductAverageRating('PRD-NONEXISTENT');
    expect(mockReviewFind).toHaveBeenCalledWith({ productId: 'PRD-NONEXISTENT', status: 'approved' });
    expect(mockProductFindOne).toHaveBeenCalledWith({ id: 'PRD-NONEXISTENT' });
  });
});
