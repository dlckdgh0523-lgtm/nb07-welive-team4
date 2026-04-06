import { parsePagination, getPaginationMeta, getSkip } from '../../src/utils/pagination.util';

describe('pagination.util', () => {
  describe('parsePagination', () => {
    it('page, limit이 undefined이면 기본값(1, 10)을 반환한다', () => {
      expect(parsePagination(undefined, undefined)).toEqual({ page: 1, limit: 10 });
    });

    it('문자열로 전달된 값을 숫자로 파싱한다', () => {
      expect(parsePagination('2', '20')).toEqual({ page: 2, limit: 20 });
    });

    it('숫자로 전달된 값을 그대로 반환한다', () => {
      expect(parsePagination(3, 15)).toEqual({ page: 3, limit: 15 });
    });

    it('0 이하의 값은 최소값 1로 보정한다', () => {
      expect(parsePagination(0, 0)).toEqual({ page: 1, limit: 1 });
    });

    it('음수 값은 최소값 1로 보정한다', () => {
      expect(parsePagination(-1, -5)).toEqual({ page: 1, limit: 1 });
    });

    it('커스텀 defaultLimit을 사용한다', () => {
      expect(parsePagination(undefined, undefined, 20)).toEqual({ page: 1, limit: 20 });
    });

    it('limit이 undefined이면 defaultLimit을 사용한다', () => {
      expect(parsePagination(2, undefined, 5)).toEqual({ page: 2, limit: 5 });
    });
  });

  describe('getPaginationMeta', () => {
    it('총 100개, 10개씩이면 10페이지를 반환한다', () => {
      expect(getPaginationMeta(100, { page: 1, limit: 10 })).toEqual({
        page: 1,
        limit: 10,
        totalCount: 100,
        totalPages: 10,
      });
    });

    it('나머지가 있으면 totalPages를 올림한다', () => {
      expect(getPaginationMeta(11, { page: 1, limit: 10 })).toEqual({
        page: 1,
        limit: 10,
        totalCount: 11,
        totalPages: 2,
      });
    });

    it('데이터가 0개이면 totalPages는 0이다', () => {
      expect(getPaginationMeta(0, { page: 1, limit: 10 })).toEqual({
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
      });
    });

    it('현재 페이지와 limit 정보가 그대로 유지된다', () => {
      const result = getPaginationMeta(50, { page: 3, limit: 5 });
      expect(result).toEqual({
        page: 3,
        limit: 5,
        totalCount: 50,
        totalPages: 10,
      });
    });
  });

  describe('getSkip', () => {
    it('1페이지이면 skip은 0이다', () => {
      expect(getSkip(1, 10)).toBe(0);
    });

    it('2페이지이면 limit만큼 skip한다', () => {
      expect(getSkip(2, 10)).toBe(10);
    });

    it('3페이지, limit 20이면 skip은 40이다', () => {
      expect(getSkip(3, 20)).toBe(40);
    });

    it('limit이 1이면 page - 1만큼 skip한다', () => {
      expect(getSkip(5, 1)).toBe(4);
    });
  });
});
