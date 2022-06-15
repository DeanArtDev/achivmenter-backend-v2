import { inject, injectable } from "inversify";
import { CorrectionModel } from "@prisma/client";
import ICorrectionController from "./correction.controller.interface";
import { AppRoute } from "../../../types/route.types";
import { ILogger } from "../../../logger";
import { FastifyReply, FastifyRequest } from "fastify";
import ICorrectionService from "../service/correction.service.interface";
import {
  CorrectionComplete,
  InputCreateCorrection,
  InputDeleteByFinancialPartIdCorrection, InputDeleteCorrection,
  InputUpdateCorrection,
} from "../types";
import { BaseController } from "../../../common/base-controller";
import { HTTPError } from "../../../error";
import { AuthGuardMiddleware } from "../../../middlewares";
import { dependenciesType } from "../../../dependencies.types";

/* todo:
 *   1. добавить схему валидации к рутам */
@injectable()
export default class CorrectionController extends BaseController implements ICorrectionController {
  private readonly url = "/corrections";

  public routes: AppRoute[] = [
    {
      url: this.url,
      method: "POST",
      handler: this.onCreateCorrection.bind(this),
      onRequest: [new AuthGuardMiddleware().execute],
    },
    {
      url: this.url,
      method: "PUT",
      handler: this.onUpdateCorrection.bind(this),
      onRequest: [new AuthGuardMiddleware().execute],
    },
    {
      url: this.url,
      method: "DELETE",
      handler: this.onDeleteCorrection.bind(this),
      onRequest: [new AuthGuardMiddleware().execute],
    },
    {
      url: this.url + "/financial-parts",
      method: "DELETE",
      handler: this.onDeleteCorrectionByFinancialPartId.bind(this),
      onRequest: [new AuthGuardMiddleware().execute],
    },
  ];

  constructor(
    @inject(dependenciesType.ILogger) private readonly loggerService: ILogger,
    @inject(dependenciesType.ICorrectionService) private readonly correctionService: ICorrectionService,
  ) {
    super(loggerService);
  }

  private async onCreateCorrection(
    request: FastifyRequest<{ Body: InputCreateCorrection }>,
    replay: FastifyReply,
  ): Promise<void> {
    const newCorrection = await this.correctionService.create(request.body);
    !newCorrection && this.error(replay, new HTTPError(422, "Such a correction is already existed", request.body));
    newCorrection && this.create<CorrectionComplete>(replay, this.responseCorrectionAdapter(newCorrection));
  }

  private async onUpdateCorrection(
    request: FastifyRequest<{ Body: InputUpdateCorrection }>,
    replay: FastifyReply,
  ): Promise<void> {
    const updatedCorrection = await this.correctionService.update(request.body);
    !updatedCorrection && this.error(replay, new HTTPError(400, "There is no such a correction to update", request.body));
    updatedCorrection && this.ok<CorrectionComplete>(replay, this.responseCorrectionAdapter(updatedCorrection));
  }

  private async onDeleteCorrectionByFinancialPartId(
    request: FastifyRequest<{ Body: InputDeleteByFinancialPartIdCorrection }>,
    replay: FastifyReply,
  ) {
    const isDeleted = await this.correctionService.deleteCorrectionByFinancialPartId(request.body.financialPartId);
    isDeleted && this.ok<boolean>(replay, isDeleted);
  }

  private async onDeleteCorrection(
    request: FastifyRequest<{ Body: InputDeleteCorrection }>,
    replay: FastifyReply,
  ) {
    const isDeleted = await this.correctionService.delete(request.body.correctionId);
    isDeleted && this.ok<boolean>(replay, isDeleted);
  }

  private responseCorrectionAdapter(correction: CorrectionModel): CorrectionComplete {
    return {
      id: String(correction.id),
      name: correction.name,
      amount: correction.amount,
    };
  }
}
