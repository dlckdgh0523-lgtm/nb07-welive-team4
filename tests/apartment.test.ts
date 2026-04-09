import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ESM 모드에서는 unstable_mockModule + dynamic import 조합 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;
const findApartmentsPublicMock = jest.fn() as jest.MockedFunction<AnyFn>;
const findApartmentPublicByIdMock = jest.fn() as jest.MockedFunction<AnyFn>;
const findApartmentsMock = jest.fn() as jest.MockedFunction<AnyFn>;
const findApartmentByIdMock = jest.fn() as jest.MockedFunction<AnyFn>;

jest.unstable_mockModule('../src/repositories/apartment.repository', () => ({
  findApartmentsPublic: findApartmentsPublicMock,
  findApartmentPublicById: findApartmentPublicByIdMock,
  findApartments: findApartmentsMock,
  findApartmentById: findApartmentByIdMock,
}));

const { getApartmentsPublic, getApartmentPublicById, getApartments, getApartmentById } =
  await import('../src/services/apartment.service');

const mockApartmentPublic = {
  id: 'apt-id-1',
  name: '테스트아파트',
  address: '서울시 강남구 테스트로 1',
};

const mockApartmentPublicDetail = {
  id: 'apt-id-1',
  name: '테스트아파트',
  address: '서울시 강남구 테스트로 1',
  startComplexNumber: '1',
  endComplexNumber: '10',
  startDongNumber: '101',
  endDongNumber: '110',
  startFloorNumber: '1',
  endFloorNumber: '20',
  startHoNumber: '101호',
  endHoNumber: '120호',
};

const mockApartmentAdmin = {
  id: 'apt-id-1',
  name: '테스트아파트',
  address: '서울시 강남구 테스트로 1',
  officeNumber: '02-1234-5678',
  description: '테스트 아파트 설명',
  startComplexNumber: '1',
  endComplexNumber: '10',
  startDongNumber: '101',
  endDongNumber: '110',
  startFloorNumber: '1',
  endFloorNumber: '20',
  startHoNumber: '101호',
  endHoNumber: '120호',
  apartmentStatus: 'APPROVED',
  adminId: 'admin-id-1',
  admin: {
    name: '관리자',
    contact: '01098765432',
    email: 'admin@example.com',
  },
};

describe('apartment.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // getApartmentsPublic
  // ──────────────────────────────────────────────
  describe('getApartmentsPublic', () => {
    it('아파트 목록과 개수를 반환한다', async () => {
      findApartmentsPublicMock.mockResolvedValue([mockApartmentPublic]);

      const result = await getApartmentsPublic({});

      expect(findApartmentsPublicMock).toHaveBeenCalledWith({});
      expect(result).toEqual({ apartments: [mockApartmentPublic], count: 1 });
    });

    it('여러 아파트가 있으면 count가 개수와 일치한다', async () => {
      const multipleApartments = [
        mockApartmentPublic,
        { ...mockApartmentPublic, id: 'apt-id-2', name: '두번째아파트' },
      ];
      findApartmentsPublicMock.mockResolvedValue(multipleApartments);

      const result = await getApartmentsPublic({});

      expect(result.count).toBe(2);
      expect(result.apartments).toHaveLength(2);
    });

    it('결과가 없으면 빈 배열과 count 0을 반환한다', async () => {
      findApartmentsPublicMock.mockResolvedValue([]);

      const result = await getApartmentsPublic({ keyword: '없는아파트' });

      expect(result).toEqual({ apartments: [], count: 0 });
    });

    it('필터 조건을 그대로 repository에 전달한다', async () => {
      findApartmentsPublicMock.mockResolvedValue([]);
      const filters = { keyword: '강남', name: '테스트', address: '서울' };

      await getApartmentsPublic(filters);

      expect(findApartmentsPublicMock).toHaveBeenCalledWith(filters);
    });
  });

  // ──────────────────────────────────────────────
  // getApartmentPublicById
  // ──────────────────────────────────────────────
  describe('getApartmentPublicById', () => {
    it('아파트를 찾으면 dong/ho range를 포함한 상세 정보를 반환한다', async () => {
      findApartmentPublicByIdMock.mockResolvedValue(mockApartmentPublicDetail);

      const result = await getApartmentPublicById('apt-id-1');

      expect(findApartmentPublicByIdMock).toHaveBeenCalledWith('apt-id-1');
      expect(result).toMatchObject({
        id: 'apt-id-1',
        name: '테스트아파트',
        dongRange: { start: '101', end: '110' },
        hoRange: { start: '101호', end: '120호' },
      });
    });

    it('아파트가 없으면 404 에러를 던진다', async () => {
      findApartmentPublicByIdMock.mockResolvedValue(null);

      await expect(getApartmentPublicById('nonexistent-id')).rejects.toMatchObject({
        message: '아파트를 찾을 수 없습니다.',
        statusCode: 404,
      });
    });
  });

  // ──────────────────────────────────────────────
  // getApartments (관리자용)
  // ──────────────────────────────────────────────
  describe('getApartments', () => {
    it('관리자 정보가 flatten된 아파트 목록과 총 개수를 반환한다', async () => {
      findApartmentsMock.mockResolvedValue({
        apartments: [mockApartmentAdmin],
        totalCount: 1,
      });

      const result = await getApartments({ page: 1, limit: 10 });

      expect(result.totalCount).toBe(1);
      expect(result.apartments[0]).toMatchObject({
        id: 'apt-id-1',
        adminName: '관리자',
        adminContact: '01098765432',
        adminEmail: 'admin@example.com',
      });
    });

    it('pagination 파라미터를 repository에 전달한다', async () => {
      findApartmentsMock.mockResolvedValue({ apartments: [], totalCount: 0 });

      await getApartments({ page: 2, limit: 20 });

      expect(findApartmentsMock).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 20 }),
      );
    });

    it('admin이 없으면 adminName 등은 null로 반환된다', async () => {
      const aptWithoutAdmin = { ...mockApartmentAdmin, admin: null };
      findApartmentsMock.mockResolvedValue({
        apartments: [aptWithoutAdmin],
        totalCount: 1,
      });

      const result = await getApartments({});

      expect(result.apartments[0]?.adminName).toBeNull();
      expect(result.apartments[0]?.adminContact).toBeNull();
      expect(result.apartments[0]?.adminEmail).toBeNull();
    });

    it('빈 결과이면 빈 배열과 totalCount 0을 반환한다', async () => {
      findApartmentsMock.mockResolvedValue({ apartments: [], totalCount: 0 });

      const result = await getApartments({});

      expect(result).toEqual({ apartments: [], totalCount: 0 });
    });
  });

  // ──────────────────────────────────────────────
  // getApartmentById (관리자용 상세)
  // ──────────────────────────────────────────────
  describe('getApartmentById', () => {
    it('올바른 ID로 repository를 호출한다', async () => {
      findApartmentByIdMock.mockResolvedValue(mockApartmentAdmin);

      await getApartmentById('apt-id-1');

      expect(findApartmentByIdMock).toHaveBeenCalledWith('apt-id-1');
    });

    it('아파트를 찾으면 dong/ho range와 admin 정보를 포함한 상세 정보를 반환한다', async () => {
      findApartmentByIdMock.mockResolvedValue(mockApartmentAdmin);

      const result = await getApartmentById('apt-id-1');

      expect(result).toMatchObject({
        id: 'apt-id-1',
        adminName: '관리자',
        adminContact: '01098765432',
        adminEmail: 'admin@example.com',
        dongRange: { start: '101', end: '110' },
        hoRange: { start: '101호', end: '120호' },
      });
    });

    it('아파트가 없으면 404 에러를 던진다', async () => {
      findApartmentByIdMock.mockResolvedValue(null);

      await expect(getApartmentById('nonexistent-id')).rejects.toMatchObject({
        message: '아파트를 찾을 수 없습니다.',
        statusCode: 404,
      });
    });
  });
});
