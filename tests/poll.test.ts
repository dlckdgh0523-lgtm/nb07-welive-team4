import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ESM 모드에서는 unstable_mockModule + dynamic import 조합 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any;

const findPollsMock = jest.fn() as jest.MockedFunction<AnyFn>;
const findPollByIdMock = jest.fn() as jest.MockedFunction<AnyFn>;
const createPollMock = jest.fn() as jest.MockedFunction<AnyFn>;
const updatePollMock = jest.fn() as jest.MockedFunction<AnyFn>;
const deletePollMock = jest.fn() as jest.MockedFunction<AnyFn>;
const findOptionByIdMock = jest.fn() as jest.MockedFunction<AnyFn>;
const findOptionsWithVotesMock = jest.fn() as jest.MockedFunction<AnyFn>;
const getUserVoteMock = jest.fn() as jest.MockedFunction<AnyFn>;
const castVoteRepoMock = jest.fn() as jest.MockedFunction<AnyFn>;
const cancelVoteRepoMock = jest.fn() as jest.MockedFunction<AnyFn>;

jest.unstable_mockModule('../src/repositories/poll.repository', () => ({
  findPolls: findPollsMock,
  findPollById: findPollByIdMock,
  createPoll: createPollMock,
  updatePoll: updatePollMock,
  deletePoll: deletePollMock,
  findOptionById: findOptionByIdMock,
  findOptionsWithVotes: findOptionsWithVotesMock,
  getUserVote: getUserVoteMock,
  castVote: castVoteRepoMock,
  cancelVote: cancelVoteRepoMock,
}));

const { getPolls, getPollById, createPoll, updatePoll, deletePoll, castVote, cancelVote } =
  await import('../src/services/poll.service');

// ──────────────────────────────────────────────
// 공통 Mock 데이터
// ──────────────────────────────────────────────
const mockPollRow = {
  id: 'poll-id-1',
  authorId: 'user-id-1',
  title: '제 3기 동대표 선출',
  content: '동대표를 선출합니다.',
  buildingPermission: 0,
  status: 'PENDING',
  startDate: new Date('2025-06-01T00:00:00Z'),
  endDate: new Date('2025-06-10T00:00:00Z'),
  createdAt: new Date('2025-05-01T00:00:00Z'),
  updatedAt: new Date('2025-05-01T00:00:00Z'),
  author: { name: '강관리자' },
  board: { name: '주민투표' },
  options: [
    { id: 'opt-id-1', title: '101호', _count: { votes: 5 } },
    { id: 'opt-id-2', title: '202호', _count: { votes: 3 } },
  ],
};

const mockOption = {
  id: 'opt-id-1',
  title: '101호',
  pollId: 'poll-id-1',
  poll: { id: 'poll-id-1', status: 'IN_PROGRESS' },
  _count: { votes: 5 },
};

describe('poll.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  // getPolls
  // ──────────────────────────────────────────────
  describe('getPolls', () => {
    it('투표 목록과 totalCount를 반환한다', async () => {
      findPollsMock.mockResolvedValue({ polls: [mockPollRow], totalCount: 1 });

      const result = await getPolls({});

      expect(result.totalCount).toBe(1);
      expect(result.polls).toHaveLength(1);
      expect(result.polls[0]).toMatchObject({
        pollId: 'poll-id-1',
        userId: 'user-id-1',
        writerName: '강관리자',
        status: 'PENDING',
      });
    });

    it('결과가 없으면 빈 배열과 totalCount 0을 반환한다', async () => {
      findPollsMock.mockResolvedValue({ polls: [], totalCount: 0 });

      const result = await getPolls({ keyword: '없는투표' });

      expect(result).toEqual({ polls: [], totalCount: 0 });
    });

    it('기본 limit은 11이다', async () => {
      findPollsMock.mockResolvedValue({ polls: [], totalCount: 0 });

      await getPolls({});

      expect(findPollsMock).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 11 }),
      );
    });

    it('status/buildingPermission/keyword 필터를 repository에 전달한다', async () => {
      findPollsMock.mockResolvedValue({ polls: [], totalCount: 0 });

      await getPolls({ status: 'IN_PROGRESS', buildingPermission: 101, keyword: '동대표' });

      expect(findPollsMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'IN_PROGRESS', buildingPermission: 101, keyword: '동대표' }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // getPollById
  // ──────────────────────────────────────────────
  describe('getPollById', () => {
    it('투표 상세 정보를 반환한다 (boardName, options 포함)', async () => {
      findPollByIdMock.mockResolvedValue(mockPollRow);

      const result = await getPollById('poll-id-1');

      expect(result).toMatchObject({
        pollId: 'poll-id-1',
        boardName: '주민투표',
        content: '동대표를 선출합니다.',
      });
      expect(result.options).toHaveLength(2);
      expect(result.options[0]).toMatchObject({ id: 'opt-id-1', title: '101호', voteCount: 5 });
    });

    it('투표가 없으면 404 에러를 던진다', async () => {
      findPollByIdMock.mockResolvedValue(null);

      await expect(getPollById('nonexistent-id')).rejects.toMatchObject({
        message: '투표를 찾을 수 없습니다.',
        statusCode: 404,
      });
    });
  });

  // ──────────────────────────────────────────────
  // createPoll
  // ──────────────────────────────────────────────
  describe('createPoll', () => {
    const validDto = {
      boardId: 'board-id-1',
      title: '제 3기 동대표 선출',
      content: '동대표를 선출합니다.',
      buildingPermission: 0,
      startDate: '2025-06-01T00:00:00Z',
      endDate: '2025-06-10T00:00:00Z',
      options: [{ title: '101호' }, { title: '202호' }],
    };

    it('정상 생성 시 성공 메시지를 반환한다', async () => {
      createPollMock.mockResolvedValue({});

      const result = await createPoll(validDto, 'user-id-1');

      expect(result).toEqual({ message: '정상적으로 등록 처리되었습니다' });
      expect(createPollMock).toHaveBeenCalledTimes(1);
    });

    it('선택지가 1개면 400 에러를 던진다', async () => {
      await expect(
        createPoll({ ...validDto, options: [{ title: '101호' }] }, 'user-id-1'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('시작일이 종료일보다 늦으면 400 에러를 던진다', async () => {
      await expect(
        createPoll({ ...validDto, startDate: '2025-06-10T00:00:00Z', endDate: '2025-06-01T00:00:00Z' }, 'user-id-1'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('시작일과 종료일이 같으면 400 에러를 던진다', async () => {
      await expect(
        createPoll({ ...validDto, startDate: '2025-06-01T00:00:00Z', endDate: '2025-06-01T00:00:00Z' }, 'user-id-1'),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('status 미입력 시 PENDING으로 기본값이 설정된다', async () => {
      createPollMock.mockResolvedValue({});

      await createPoll(validDto, 'user-id-1');

      expect(createPollMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING' }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // updatePoll
  // ──────────────────────────────────────────────
  describe('updatePoll', () => {
    it('PENDING 상태의 투표를 수정한다', async () => {
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'PENDING' });
      updatePollMock.mockResolvedValue({});

      await updatePoll('poll-id-1', { title: '수정된 제목' });

      expect(updatePollMock).toHaveBeenCalledWith('poll-id-1', expect.objectContaining({ title: '수정된 제목' }));
    });

    it('IN_PROGRESS 상태의 투표는 수정할 수 없다', async () => {
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'IN_PROGRESS' });

      await expect(updatePoll('poll-id-1', { title: '수정 시도' })).rejects.toMatchObject({
        statusCode: 400,
        message: '이미 시작된 투표는 수정할 수 없습니다.',
      });
    });

    it('투표가 없으면 404 에러를 던진다', async () => {
      findPollByIdMock.mockResolvedValue(null);

      await expect(updatePoll('nonexistent-id', {})).rejects.toMatchObject({ statusCode: 404 });
    });

    it('options 수정 시 선택지가 1개면 400 에러를 던진다', async () => {
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'PENDING' });

      await expect(
        updatePoll('poll-id-1', { options: [{ title: '하나만' }] }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('수정 시 startDate가 endDate보다 늦으면 400 에러를 던진다', async () => {
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'PENDING' });

      await expect(
        updatePoll('poll-id-1', { startDate: '2025-06-10T00:00:00Z', endDate: '2025-06-01T00:00:00Z' }),
      ).rejects.toMatchObject({ statusCode: 400, message: '시작일은 종료일보다 이전이어야 합니다.' });
    });

    it('startDate만 변경 시 기존 endDate와 비교해 유효성을 검증한다', async () => {
      // 기존 endDate: 2025-06-10, 새 startDate: 2025-06-11 → 오류
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'PENDING' });

      await expect(
        updatePoll('poll-id-1', { startDate: '2025-06-11T00:00:00Z' }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('잘못된 날짜 형식이면 400 에러를 던진다', async () => {
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'PENDING' });

      await expect(
        updatePoll('poll-id-1', { startDate: 'not-a-date' }),
      ).rejects.toMatchObject({ statusCode: 400, message: '올바른 날짜 형식을 입력해주세요.' });
    });
  });

  // ──────────────────────────────────────────────
  // deletePoll
  // ──────────────────────────────────────────────
  describe('deletePoll', () => {
    it('PENDING 상태의 투표를 삭제한다', async () => {
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'PENDING' });
      deletePollMock.mockResolvedValue({});

      await deletePoll('poll-id-1');

      expect(deletePollMock).toHaveBeenCalledWith('poll-id-1');
    });

    it('IN_PROGRESS 상태의 투표는 삭제할 수 없다', async () => {
      findPollByIdMock.mockResolvedValue({ ...mockPollRow, status: 'IN_PROGRESS' });

      await expect(deletePoll('poll-id-1')).rejects.toMatchObject({
        statusCode: 400,
        message: '이미 시작된 투표는 삭제할 수 없습니다.',
      });
    });

    it('투표가 없으면 404 에러를 던진다', async () => {
      findPollByIdMock.mockResolvedValue(null);

      await expect(deletePoll('nonexistent-id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ──────────────────────────────────────────────
  // castVote
  // ──────────────────────────────────────────────
  describe('castVote', () => {
    const mockOptionsWithVotes = [
      { id: 'opt-id-1', title: '101호', _count: { votes: 6 } },
      { id: 'opt-id-2', title: '202호', _count: { votes: 3 } },
    ];

    beforeEach(() => {
      findOptionByIdMock.mockResolvedValue(mockOption);
      getUserVoteMock.mockResolvedValue(null);
      castVoteRepoMock.mockResolvedValue({});
      findOptionsWithVotesMock.mockResolvedValue(mockOptionsWithVotes);
    });

    it('정상 투표 시 message, updatedOption, winnerOption, options를 반환한다', async () => {
      const result = await castVote('opt-id-1', 'user-id-1');

      expect(result.message).toBe('투표가 완료되었습니다.');
      expect(result.updatedOption).toMatchObject({ id: 'opt-id-1', votes: 6 });
      expect(result.winnerOption).toMatchObject({ id: 'opt-id-1', votes: 6 });
      expect(result.options).toHaveLength(2);
    });

    it('선택지가 없으면 404 에러를 던진다', async () => {
      findOptionByIdMock.mockResolvedValue(null);

      await expect(castVote('nonexistent-opt', 'user-id-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('IN_PROGRESS가 아닌 투표에는 참여할 수 없다', async () => {
      findOptionByIdMock.mockResolvedValue({
        ...mockOption,
        poll: { status: 'PENDING' },
      });

      await expect(castVote('opt-id-1', 'user-id-1')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('이미 투표한 경우 409 에러를 던진다', async () => {
      getUserVoteMock.mockResolvedValue({ id: 'vote-id-1', optionId: 'opt-id-1' });

      await expect(castVote('opt-id-1', 'user-id-1')).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ──────────────────────────────────────────────
  // cancelVote
  // ──────────────────────────────────────────────
  describe('cancelVote', () => {
    const mockExistingVote = { id: 'vote-id-1', optionId: 'opt-id-1', pollId: 'poll-id-1' };
    const mockOptionAfterCancel = { ...mockOption, _count: { votes: 4 } };

    beforeEach(() => {
      findOptionByIdMock.mockResolvedValue(mockOption);
      getUserVoteMock.mockResolvedValue(mockExistingVote);
      cancelVoteRepoMock.mockResolvedValue({});
    });

    it('정상 취소 시 message와 updatedOption을 반환한다', async () => {
      findOptionByIdMock
        .mockResolvedValueOnce(mockOption)        // 첫 번째 호출: 선택지 조회
        .mockResolvedValueOnce(mockOptionAfterCancel); // 두 번째 호출: 취소 후 득표수 조회

      const result = await cancelVote('opt-id-1', 'user-id-1');

      expect(result.message).toBe('투표가 취소되었습니다.');
      expect(result.updatedOption).toMatchObject({ id: 'opt-id-1', votes: 4 });
    });

    it('선택지가 없으면 404 에러를 던진다', async () => {
      findOptionByIdMock.mockResolvedValue(null);

      await expect(cancelVote('nonexistent-opt', 'user-id-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('투표 내역이 없으면 404 에러를 던진다', async () => {
      getUserVoteMock.mockResolvedValue(null);

      await expect(cancelVote('opt-id-1', 'user-id-1')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('다른 선택지에 투표한 경우 400 에러를 던진다', async () => {
      getUserVoteMock.mockResolvedValue({ ...mockExistingVote, optionId: 'opt-id-2' });

      await expect(cancelVote('opt-id-1', 'user-id-1')).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
