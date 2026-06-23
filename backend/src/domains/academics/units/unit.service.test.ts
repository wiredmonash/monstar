import { Review } from '@domains/academics/reviews';
import { Unit, UnitService } from '@domains/academics/units';

describe(UnitService.name, () => {
  afterEach(() => vi.clearAllMocks());

  describe(UnitService.fetchPaginated.name, () => {
    it('should return the correct number of units based on the limit', async () => {
      // arrange
      const limit = 5;
      // act
      const results = await UnitService.fetchPaginated({ limit: limit });
      // assert
      expect(results.units.length).toEqual(limit);
    });

    it('should return different units when the offset is changed', async () => {
      // act
      const page1 = await UnitService.fetchPaginated({ limit: 5, offset: 0 });
      const page2 = await UnitService.fetchPaginated({ limit: 5, offset: 1 });
      // assert
      expect(page1.units[0].unitCode).not.toEqual(page2.units[0].unitCode);
    });
  });

  describe(UnitService.fetchMostReviewed.name, () => {
    it('should return populated units', async () => {
      // act
      const results = await UnitService.fetchMostReviewed(10);
      // assert
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);
      for (let i = 0; i <= results.length - 2; i++) {
        const current = results[i].reviews.length;
        const next = results[i + 1].reviews.length;

        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe(UnitService.modifyByUnitcode.name, () => {
    it('should return a updated unit', async () => {
      // arrange: grab some unit
      const unit = (await Unit.findOne({ unitCode: 'fit1049' }))!;
      // act: call the service to modify a separate one
      const updatedUnit = await UnitService.modifyByUnitcode('fit1049', {
        name: 'A new name for this unit',
        avgContentRating: 5,
        avgFacultyRating: 5,
        avgRelevancyRating: 5,
      });
      // assert: compare the two
      expect(unit.toObject()).not.toEqual(updatedUnit.toObject());
    });

    it('should prevent modification to disallowed fields', async () => {
      // assert
      await expect(
        UnitService.modifyByUnitcode('fit1049', { unitCode: 'fit6969' })
      ).rejects.toThrow('Disallowed fields present in update data');
    });
  });
});
