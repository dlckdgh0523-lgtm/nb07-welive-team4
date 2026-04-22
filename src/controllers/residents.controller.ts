import { Request, Response } from "express";
import { CreateResidentDTO, GetResidentsQuery, UpdateResidentDTO } from "../structs/resident.struct";
import { userIdParam } from "../structs/user.struct";
import { ResidentsService } from "../services/residents.service";
import { BadRequestError, ForbiddenError } from "../errors/errors";
import { ResidentId } from "../structs/auth.struct";

export class ResidentsController {
  private residentsService = new ResidentsService();

  getResidents = async (req: Request<{}, {}, {}, GetResidentsQuery>, res: Response) => {
    const apartmentId = req.user.apartmentId;
    const { residents, totalCount, count, message } = await this.residentsService.getResidents(req.query, apartmentId!);

    res.status(200).json({ residents, message, count, totalCount });
  };

  createResident = async (req: Request<{}, {}, CreateResidentDTO>, res: Response) => {
    const apartmentId = req.user.apartmentId;

    if (!apartmentId) {
      return new ForbiddenError("아파트 정보가 없는 사용자입니다.");
    }

    const resident = await this.residentsService.createResident(req.body, apartmentId);

    res.status(201).json(resident);
  };

  createResidentFromUser = async (req: Request<userIdParam>, res: Response) => {
    const userId = req.params.userId;
    const apartmentId = req.user.apartmentId!;
    const resident = await this.residentsService.createResidentFromUser(userId, apartmentId);

    res.status(201).json(resident);
  };

  downloadResidentTemplate = async (req: Request, res: Response) => {
    const csvContent = await this.residentsService.generateEmptyTemplate();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="residents_list.csv"');
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.status(200).send(csvContent);
  };

  createResidentsFromFile = async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError("업로드된 파일이 없습니다.");

    const apartmentId = req.user.apartmentId!;
    const result = await this.residentsService.processResidentCsv(req.file.buffer, apartmentId);

    res.status(201).json({
      message: `${result.count}명의  입주민이 등록되었습니다`,
      count: result.count,
    });
  };

  downloadResidentList = async (req: Request<{}, {}, {}, GetResidentsQuery>, res: Response) => {
    const apartmentId = req.user.apartmentId!;
    const queryData = req.query;

    const csvContent = await this.residentsService.downloadResidentsAsCsv(apartmentId, queryData);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="residents_list.csv"');
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.status(200).send(csvContent);
  };

  getResidentById = async (req: Request<ResidentId>, res: Response) => {
    const { residentId } = req.params;
    const apartmentId = req.user.apartmentId!;

    const resident = await this.residentsService.getResidentById(residentId, apartmentId);

    res.status(200).json(resident);
  };

  updateResident = async (req: Request<ResidentId, {}, UpdateResidentDTO>, res: Response) => {
    const { residentId } = req.params;
    const apartmentId = req.user.apartmentId!;

    const updatedResident = await this.residentsService.updateResident(residentId, apartmentId, req.body);

    res.status(200).json(updatedResident);
  };

  deleteResident = async (req: Request<ResidentId>, res: Response) => {
    const { residentId } = req.params;
    const apartmentId = req.user.apartmentId!;

    await this.residentsService.deleteResident(residentId, apartmentId);

    res.status(204).end();
  };
}
