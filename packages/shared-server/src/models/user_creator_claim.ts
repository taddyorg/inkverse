import { database } from "../database/index.js";
import { type UserCreatorClaimModel } from '@inkverse/shared-server/database/types';
import { CreatorClaimStatus } from '../graphql/types.js';
import { generateRandomString } from "../utils/crypto.js";
import { currentDate } from "../utils/date.js";

export class UserCreatorClaim {
  static async getApprovedClaimByCreatorUuid(creatorUuid: string): Promise<UserCreatorClaimModel | null> {
    return await database("user_creator_claims")
      .where({ creatorUuid, status: CreatorClaimStatus.APPROVED })
      .first('*');
  }

  static async getClaimByToken(token: string): Promise<UserCreatorClaimModel | null> {
    return await database("user_creator_claims")
      .where({ claimToken: token })
      .where('claimTokenExpiry', '>', currentDate())
      .first('*');
  }

  static async getClaimByUserAndCreator(userId: number | string, creatorUuid: string): Promise<UserCreatorClaimModel | null> {
    return await database("user_creator_claims")
      .where({ userId, creatorUuid })
      .first('*');
  }

  static async createClaim(userId: number | string, creatorUuid: string): Promise<UserCreatorClaimModel> {
    const claimToken = await generateRandomString(80);
    const claimTokenExpiry = currentDate() + (7 * 24 * 60 * 60); // 7 days in seconds

    const [claim] = await database("user_creator_claims")
      .insert({
        userId,
        creatorUuid,
        status: CreatorClaimStatus.PENDING,
        claimToken,
        claimTokenExpiry,
      })
      .returning('*');

    return claim;
  }

  static async approveClaim(token: string): Promise<UserCreatorClaimModel | null> {
    const claim = await UserCreatorClaim.getClaimByToken(token);
    if (!claim || claim.status !== CreatorClaimStatus.PENDING) return null;

    const [updatedClaim] = await database("user_creator_claims")
      .where({ id: claim.id })
      .update({ status: CreatorClaimStatus.APPROVED })
      .returning('*');

    // Set creator_uuid on the user
    await database("users")
      .where({ id: claim.userId })
      .update({
        updatedAt: currentDate(),
        creatorUuid: claim.creatorUuid,
      });

    return updatedClaim;
  }

  static async refreshClaimToken(claimId: number): Promise<UserCreatorClaimModel> {
    const claimToken = await generateRandomString(80);
    const claimTokenExpiry = currentDate() + (7 * 24 * 60 * 60); // 7 days in seconds

    const [claim] = await database("user_creator_claims")
      .where({ id: claimId })
      .update({ claimToken, claimTokenExpiry })
      .returning('*');

    return claim;
  }

  static async rejectClaim(token: string): Promise<UserCreatorClaimModel | null> {
    const claim = await UserCreatorClaim.getClaimByToken(token);
    if (!claim) return null;

    const [updatedClaim] = await database("user_creator_claims")
      .where({ id: claim.id })
      .update({ status: CreatorClaimStatus.REJECTED })
      .returning('*');

    return updatedClaim;
  }
}
