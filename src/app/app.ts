import Fastify, { FastifyInstance } from "fastify";
import { inject, injectable } from "inversify";
import { IApp } from "./app.interface";
import { IFinancialReportController } from "../financial-report";
import { dependenciesType } from "../dependencies.types";
import { IConfigService, envVariable } from "../config";
import { ILogger } from "../logger";
import "reflect-metadata";
@injectable()
export class App implements IApp {
  private app: FastifyInstance;

  private bindRouters(): void {
    const routes = [];
    routes.push(...this.financialReportController.routes);

    for (const route of routes) {
      this.logger.log(`[APP] ${route.url}:[${route.method}] is successful added`);
      this.app.route(route);
    }
  }

  constructor(
    @inject(dependenciesType.IConfigService) private config: IConfigService,
    @inject(dependenciesType.ILogger) private logger: ILogger,
    @inject(dependenciesType.IFinancialReportController) private financialReportController: IFinancialReportController,
  ) {
    this.app = Fastify();
  }

  public async init(): Promise<void> {
    try {
      this.bindRouters();
      const address = await this.app.listen(this.config.get(envVariable.APP_PORT));
      this.logger.log(
        `[APP] Server start listening to ${address} ${
          this.config.isDevelopmentMode ? `http:/localhost:${this.config.get(envVariable.APP_PORT)}` : ""
        }`,
      );
    } catch (e) {
      this.logger.error(`[APP] something went wrong`, e);
    }
  }

  public async close(): Promise<void> {
    await this.app.close();
  }
}
