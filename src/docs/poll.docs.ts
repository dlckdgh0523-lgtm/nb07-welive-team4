export const pollDocs = {
  "/api/polls": {
    get: {
      tags: ["Polls"],
      summary: "투표 글 전체 조회",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "number", default: 1 } },
        { name: "limit", in: "query", schema: { type: "number", default: 11 } },
        { name: "buildingPermission", in: "query", schema: { type: "number" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "IN_PROGRESS", "CLOSED"] } },
        { name: "keyword", in: "query", schema: { type: "string", description: "투표 제목, 내용 검색" } },
      ],
      responses: { 200: { description: "투표 글 전체 조회 성공" } },
    },
    post: {
      tags: ["Polls"],
      summary: "투표 글 작성",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["boardId", "title", "content", "startDate", "endDate", "options"],
              properties: {
                boardId: { type: "string" },
                status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "CLOSED"] },
                title: { type: "string" },
                content: { type: "string" },
                buildingPermission: { type: "number", default: 0 },
                startDate: { type: "string", format: "date-time" },
                endDate: { type: "string", format: "date-time" },
                options: { type: "array", items: { type: "object", properties: { title: { type: "string" } } } },
              },
            },
          },
        },
      },
      responses: { 201: { description: "투표 등록 성공" } },
    },
  },
  "/api/polls/{pollId}": {
    get: {
      tags: ["Polls"],
      summary: "투표 글 상세 조회",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "pollId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "투표 글 상세 조회 성공" },
        404: { description: "투표를 찾을 수 없음" },
      },
    },
    patch: {
      tags: ["Polls"],
      summary: "투표 글 수정 (PENDING 상태만)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "pollId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "투표 수정 성공" },
        400: { description: "이미 시작된 투표는 수정 불가" },
      },
    },
    delete: {
      tags: ["Polls"],
      summary: "투표 글 삭제 (PENDING 상태만)",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "pollId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "투표 삭제 성공" },
        400: { description: "이미 시작된 투표는 삭제 불가" },
      },
    },
  },
  "/api/options/{optionId}/vote": {
    post: {
      tags: ["Polls"],
      summary: "투표하기",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "optionId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "투표 완료" },
        400: { description: "진행 중인 투표만 참여 가능" },
        409: { description: "이미 투표에 참여함" },
      },
    },
    delete: {
      tags: ["Polls"],
      summary: "투표 취소",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "optionId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "투표 취소 성공" },
        404: { description: "투표 내역 없음" },
      },
    },
  },
  "/api/poll-scheduler/ping": {
    get: {
      tags: ["Poll Scheduler"],
      summary: "Poll 스케줄러 상태 확인 (개발용)",
      responses: { 200: { description: "정상 동작 중" } },
    },
  },
};
