export const apartmentDocs = {
  "/api/apartments/public": {
    get: {
      tags: ["Apartments"],
      summary: "[공개용/회원가입] 아파트 목록 조회",
      parameters: [
        { name: "keyword", in: "query", schema: { type: "string" }, description: "검색 키워드" },
        { name: "name", in: "query", schema: { type: "string" }, description: "아파트 이름 필터" },
        { name: "address", in: "query", schema: { type: "string" }, description: "아파트 주소 필터" },
      ],
      responses: {
        200: { description: "아파트 목록 조회 성공(공개)" },
      },
    },
  },
  "/api/apartments/public/{id}": {
    get: {
      tags: ["Apartments"],
      summary: "[공개용/회원가입] 아파트 기본 정보 상세 조회",
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "아파트 상세 조회 성공" },
        404: { description: "아파트를 찾을 수 없음" },
      },
    },
  },
  "/api/apartments": {
    get: {
      tags: ["Apartments"],
      summary: "[슈퍼관리자/관리자] 아파트 목록 조회",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "name", in: "query", schema: { type: "string" } },
        { name: "address", in: "query", schema: { type: "string" } },
        { name: "searchKeyword", in: "query", schema: { type: "string" } },
        { name: "apartmentStatus", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] } },
        { name: "page", in: "query", schema: { type: "number", default: 1 } },
        { name: "limit", in: "query", schema: { type: "number", default: 10 } },
      ],
      responses: {
        200: { description: "아파트 목록 조회 성공" },
        400: { description: "잘못된 요청" },
        403: { description: "권한 없음(관리자 전용)" },
      },
    },
  },
  "/api/apartments/{id}": {
    get: {
      tags: ["Apartments"],
      summary: "[슈퍼관리자/관리자] 아파트 상세 조회",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "아파트 상세 조회 성공" },
        404: { description: "아파트를 찾을 수 없음" },
      },
    },
  },
};