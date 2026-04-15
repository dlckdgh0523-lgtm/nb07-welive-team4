export type PollStatus = "PENDING" | "IN_PROGRESS" | "CLOSED";

export interface PollListQuery {
  status?: PollStatus;
  buildingPermission?: number;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface PollOptionInput {
  title: string;
}

export interface CreatePollDto {
  boardId: string;
  status?: PollStatus;
  title: string;
  content: string;
  buildingPermission: number;
  startDate: string;
  endDate: string;
  options: PollOptionInput[];
}

export interface UpdatePollDto {
  title?: string;
  content?: string;
  buildingPermission?: number;
  startDate?: string;
  endDate?: string;
  status?: PollStatus;
  options?: PollOptionInput[];
}

export interface PollListItem {
  pollId: string;
  userId: string;
  title: string;
  writerName: string;
  buildingPermission: number;
  createdAt: Date;
  updatedAt: Date;
  startDate: Date;
  endDate: Date;
  status: PollStatus;
}

export interface PollListResponse {
  polls: PollListItem[];
  totalCount: number;
}

export interface PollOptionDetail {
  id: string;
  title: string;
  voteCount: number;
}

export interface PollDetailResponse {
  pollId: string;
  userId: string;
  title: string;
  writerName: string;
  buildingPermission: number;
  createdAt: Date;
  updatedAt: Date;
  startDate: Date;
  endDate: Date;
  status: PollStatus;
  content: string;
  boardName: string;
  options: PollOptionDetail[];
}

export interface OptionWithVotes {
  id: string;
  title: string;
  votes: number;
}
