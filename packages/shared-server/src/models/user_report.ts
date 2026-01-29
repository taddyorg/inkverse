import { database } from "../database/index.js";
import type { UserReportModel } from "../database/types.js";
import { InkverseType, ReportType } from "../graphql/types.js";

export class UserReport {
  /**
   * Create a report (upsert - creates or updates if already exists)
   */
  static async report(
    targetUuid: string,
    targetType: InkverseType,
    reportType: ReportType,
    reporterUserId: number,
    additionalInfo?: string | null
  ): Promise<UserReportModel | null> {
    const [report] = await database('user_reports')
      .insert({
        targetUuid,
        targetType,
        reportType,
        reporterUserId,
        additionalInfo: additionalInfo || null,
      })
      .onConflict(['targetType', 'targetUuid', 'reporterUserId'])
      .merge({
        reportType,
        additionalInfo: additionalInfo || null,
      })
      .returning('*');

    return report || null;
  }

  /**
   * Check if a user has reported a target
   */
  static async hasUserReported(
    targetUuid: string,
    targetType: InkverseType,
    reporterUserId: number
  ): Promise<boolean> {
    const report = await database('user_reports')
      .where({ targetUuid, targetType, reporterUserId })
      .first('id');

    return !!report;
  }

  /**
   * Get report count for a target
   */
  static async getReportCount(
    targetUuid: string,
    targetType: InkverseType
  ): Promise<number> {
    const result = await database('user_reports')
      .where({ targetUuid, targetType })
      .count('id as count')
      .first();

    return Number(result?.count || 0);
  }

  /**
   * Get all reports for a target
   */
  static async getReportsForTarget(
    targetUuid: string,
    targetType: InkverseType
  ): Promise<UserReportModel[]> {
    const reports = await database('user_reports')
      .where({ targetUuid, targetType })
      .orderBy('createdAt', 'desc')
      .select('*');

    return reports;
  }
}
