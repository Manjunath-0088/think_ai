import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateWishlist, addToWishlist, getWishlistIds, removeFromWishlist, toggleWishlist, __resetWishlistForTests } from '@/features/wishlist/wishlistStore';

describe('wishlist store', () => {
  beforeEach(() => __resetWishlistForTests());
  it('adds, toggles, removes, and deduplicates saved course ids', () => {
    addToWishlist('course-1');
    addToWishlist('course-1');
    expect(getWishlistIds()).toEqual(['course-1']);
    toggleWishlist('course-2');
    expect(getWishlistIds()).toEqual(['course-2', 'course-1']);
    removeFromWishlist('course-1');
    expect(getWishlistIds()).toEqual(['course-2']);
  });

  it('keeps saved courses isolated when the active account changes', async () => {
    await activateWishlist('learner-101');
    addToWishlist('course-a', 'learner-101');

    await activateWishlist('learner-202');
    expect(getWishlistIds()).toEqual([]);
    addToWishlist('course-b', 'learner-202');

    await activateWishlist('learner-101');
    expect(getWishlistIds('learner-101')).toEqual(['course-a']);
  });

  it('keeps an item added while the account list is still hydrating', async () => {
    let resolveRead!: (value: string | null) => void;
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => { resolveRead = resolve; }),
    );

    const hydration = activateWishlist('learner-303');
    await Promise.resolve();
    addToWishlist('course-during-hydration', 'learner-303');
    resolveRead(null);
    await hydration;

    expect(getWishlistIds('learner-303')).toEqual(['course-during-hydration']);
  });
});
