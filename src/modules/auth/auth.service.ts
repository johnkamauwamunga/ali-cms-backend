import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { errors as joseErrors } from "jose";
import { HTTPException } from "hono/http-exception";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";
import {
  hashPassword,
  hashSecret,
  verifyPassword,
} from "../../lib/password.js";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
} from "../../lib/tokens.js";
import type {
  ChangePasswordInput,
  InitialSetupInput,
  LoginInput,
  SecurityQuestionUpdateInput,
} from "./auth.schema.js";

const adminSummarySelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  isActive: true,
} satisfies Prisma.AdminSelect;

const loginAdminSelect = {
  ...adminSummarySelect,
  passwordHash: true,
  failedLoginAttempts: true,
  lockedUntil: true,
} satisfies Prisma.AdminSelect;

export type AdminIdentity = Prisma.AdminGetPayload<{
  select: typeof adminSummarySelect;
}>;

type LoginAdmin = Prisma.AdminGetPayload<{
  select: typeof loginAdminSelect;
}>;

export interface AuthSession {
  admin: AdminIdentity;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
}

interface TokenMaterial {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshExpiresAt: Date;
}

type RefreshResult =
  | { status: "invalid" | "reused" }
  | {
      status: "rotated";
      admin: AdminIdentity;
      tokenMaterial: TokenMaterial;
    };

const toAdminIdentity = (admin: LoginAdmin): AdminIdentity => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  phone: admin.phone,
  isActive: admin.isActive,
});

const tokenLifetimeToMilliseconds = (duration: string): number => {
  const match = /^([1-9]\d*)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error("Invalid token lifetime configuration");
  }

  const amount = Number(match[1]);
  let multiplier: number;

  switch (match[2]) {
    case "s":
      multiplier = 1_000;
      break;
    case "m":
      multiplier = 60_000;
      break;
    case "h":
      multiplier = 3_600_000;
      break;
    case "d":
      multiplier = 86_400_000;
      break;
    default:
      throw new Error("Invalid token lifetime configuration");
  }

  const milliseconds = amount * multiplier;

  if (!Number.isSafeInteger(milliseconds)) {
    throw new Error("Token lifetime exceeds the supported range");
  }

  return milliseconds;
};

const createTokenMaterial = async (adminId: string): Promise<TokenMaterial> => {
  const [accessToken, refreshTokenResult] = await Promise.all([
    createAccessToken(adminId),
    createRefreshToken(adminId),
  ]);
  const refreshExpiresAt = new Date(
    Date.now() + tokenLifetimeToMilliseconds(env.REFRESH_TOKEN_EXPIRES_IN),
  );

  if (
    Number.isNaN(refreshExpiresAt.getTime()) ||
    refreshExpiresAt.getUTCFullYear() > 9999
  ) {
    throw new Error("Refresh token lifetime exceeds the database date range");
  }

  return {
    accessToken,
    refreshToken: refreshTokenResult.token,
    refreshTokenHash: hashRefreshToken(refreshTokenResult.token),
    refreshExpiresAt,
  };
};

const toAuthSession = (
  admin: AdminIdentity,
  tokenMaterial: TokenMaterial,
): AuthSession => ({
  admin,
  accessToken: tokenMaterial.accessToken,
  refreshToken: tokenMaterial.refreshToken,
  accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
});

const invalidCredentials = (): HTTPException =>
  new HTTPException(401, { message: "Invalid credentials" });

const invalidRefreshToken = (): HTTPException =>
  new HTTPException(401, { message: "Invalid or expired refresh token" });

const dummyPasswordHash = hashPassword(randomBytes(32).toString("base64url"));

const verifyUnknownAccountPassword = async (password: string): Promise<void> => {
  await verifyPassword(await dummyPasswordHash, password);
};

const verifyRefreshTokenForRequest = async (
  token: string,
): Promise<{ adminId: string; tokenId: string }> => {
  try {
    return await verifyRefreshToken(token);
  } catch (error) {
    if (
      error instanceof joseErrors.JOSEError ||
      (error instanceof Error &&
        (error.message === "Invalid authentication token" ||
          error.message === "Invalid refresh token"))
    ) {
      throw invalidRefreshToken();
    }

    throw error;
  }
};

export const createInitialAdmin = async (
  input: InitialSetupInput,
): Promise<AdminIdentity> => {
  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.$transaction(
      async (transaction) => {
        const existingAdmin = await transaction.admin.findFirst({
          select: { id: true },
        });

        if (existingAdmin) {
          throw new HTTPException(409, {
            message: "Initial setup is already complete",
          });
        }

        return transaction.admin.create({
          data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            passwordHash,
            authSettings: {
              create: {
                loginEnabled: true,
              },
            },
          },
          select: adminSummarySelect,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      throw new HTTPException(409, {
        message: "Initial setup is already complete",
      });
    }

    throw error;
  }
};

export const login = async (
  input: LoginInput,
  metadata: SessionMetadata = {},
): Promise<AuthSession> => {
  const authSettings = await prisma.authSettings.findUnique({
    where: { id: "singleton" },
    select: {
      loginEnabled: true,
      maxFailedLoginAttempts: true,
      lockoutDurationMinutes: true,
    },
  });

  if (authSettings?.loginEnabled === false) {
    throw new HTTPException(403, { message: "Login is currently unavailable" });
  }

  const admin = await prisma.admin.findFirst({
    where: {
      OR: [{ email: input.identifier }, { phone: input.identifier }],
    },
    select: loginAdminSelect,
  });

  if (!admin) {
    await verifyUnknownAccountPassword(input.password);
    throw invalidCredentials();
  }

  const passwordMatches = await verifyPassword(
    admin.passwordHash,
    input.password,
  );
  const now = new Date();

  if (admin.lockedUntil && admin.lockedUntil > now) {
    throw invalidCredentials();
  }

  if (!passwordMatches) {
    const failedLoginAttempts = await prisma.admin.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    const maxFailedLoginAttempts = Math.max(
      1,
      authSettings?.maxFailedLoginAttempts ?? 5,
    );

    if (failedLoginAttempts.failedLoginAttempts >= maxFailedLoginAttempts) {
      const lockoutDurationMinutes = Math.max(
        1,
        authSettings?.lockoutDurationMinutes ?? 15,
      );

      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          lockedUntil: new Date(now.getTime() + lockoutDurationMinutes * 60_000),
        },
      });
    }

    throw invalidCredentials();
  }

  if (!admin.isActive) {
    throw invalidCredentials();
  }

  const tokenMaterial = await createTokenMaterial(admin.id);
  const userAgent = metadata.userAgent?.slice(0, 512);
  const ipAddress = metadata.ipAddress?.slice(0, 45);

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        adminId: admin.id,
        tokenHash: tokenMaterial.refreshTokenHash,
        expiresAt: tokenMaterial.refreshExpiresAt,
        userAgent,
        ipAddress,
      },
    }),
    prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    }),
  ]);

  return toAuthSession(toAdminIdentity(admin), tokenMaterial);
};

export const refreshSession = async (
  rawRefreshToken: string,
  metadata: SessionMetadata = {},
): Promise<AuthSession> => {
  const claims = await verifyRefreshTokenForRequest(rawRefreshToken);
  const tokenMaterial = await createTokenMaterial(claims.adminId);
  const oldTokenHash = hashRefreshToken(rawRefreshToken);
  const now = new Date();
  const userAgent = metadata.userAgent?.slice(0, 512);
  const ipAddress = metadata.ipAddress?.slice(0, 45);

  let result: RefreshResult;

  try {
    result = await prisma.$transaction(
      async (transaction): Promise<RefreshResult> => {
        const storedToken = await transaction.refreshToken.findUnique({
          where: { tokenHash: oldTokenHash },
          select: {
            id: true,
            adminId: true,
            expiresAt: true,
            revokedAt: true,
            admin: {
              select: {
                ...adminSummarySelect,
              },
            },
          },
        });

        if (
          !storedToken ||
          storedToken.adminId !== claims.adminId ||
          storedToken.expiresAt <= now
        ) {
          return { status: "invalid" };
        }

        if (storedToken.revokedAt || !storedToken.admin.isActive) {
          await transaction.refreshToken.updateMany({
            where: { adminId: storedToken.adminId, revokedAt: null },
            data: { revokedAt: now },
          });

          return {
            status: storedToken.revokedAt ? "reused" : "invalid",
          };
        }

        const revokedToken = await transaction.refreshToken.updateMany({
          where: {
            id: storedToken.id,
            adminId: claims.adminId,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          data: { revokedAt: now },
        });

        if (revokedToken.count !== 1) {
          const currentToken = await transaction.refreshToken.findUnique({
            where: { id: storedToken.id },
            select: { revokedAt: true },
          });

          if (currentToken?.revokedAt) {
            await transaction.refreshToken.updateMany({
              where: { adminId: storedToken.adminId, revokedAt: null },
              data: { revokedAt: now },
            });

            return { status: "reused" };
          }

          return { status: "invalid" };
        }

        await transaction.refreshToken.create({
          data: {
            adminId: claims.adminId,
            tokenHash: tokenMaterial.refreshTokenHash,
            expiresAt: tokenMaterial.refreshExpiresAt,
            userAgent,
            ipAddress,
          },
        });

        return {
          status: "rotated",
          admin: storedToken.admin,
          tokenMaterial,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      await prisma.refreshToken.updateMany({
        where: { adminId: claims.adminId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      throw invalidRefreshToken();
    }

    throw error;
  }

  if (result.status !== "rotated") {
    throw invalidRefreshToken();
  }

  return toAuthSession(result.admin, result.tokenMaterial);
};

export const logout = async (
  rawRefreshToken: string | undefined,
): Promise<void> => {
  if (!rawRefreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashRefreshToken(rawRefreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
};

export const getAdminById = (
  adminId: string,
): Promise<AdminIdentity | null> =>
  prisma.admin.findUnique({
    where: { id: adminId },
    select: adminSummarySelect,
  });

export const changePassword = async (
  adminId: string,
  input: ChangePasswordInput,
): Promise<void> => {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { passwordHash: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  if (!(await verifyPassword(admin.passwordHash, input.currentPassword))) {
    throw new HTTPException(400, { message: "Current password is incorrect" });
  }

  if (await verifyPassword(admin.passwordHash, input.newPassword)) {
    throw new HTTPException(400, {
      message: "New password must differ from the current password",
    });
  }

  const passwordHash = await hashPassword(input.newPassword);
  const now = new Date();

  await prisma.$transaction([
    prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash },
    }),
    prisma.refreshToken.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
};

export const listSecurityQuestions = () =>
  prisma.securityQuestion.findMany({
    where: { isActive: true },
    select: { id: true, question: true },
    orderBy: { sortOrder: "asc" },
  });

export const updateSecurityQuestion = async (
  adminId: string,
  input: SecurityQuestionUpdateInput,
): Promise<void> => {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { passwordHash: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  if (!(await verifyPassword(admin.passwordHash, input.currentPassword))) {
    throw new HTTPException(400, { message: "Current password is incorrect" });
  }

  const securityQuestion = await prisma.securityQuestion.findFirst({
    where: { id: input.securityQuestionId, isActive: true },
    select: { id: true },
  });

  if (!securityQuestion) {
    throw new HTTPException(400, {
      message: "Selected security question is unavailable",
    });
  }

  const securityAnswerHash = await hashSecret(
    input.securityAnswer.normalize("NFKC").trim().toLowerCase(),
  );

  await prisma.authSettings.update({
    where: { adminId },
    data: {
      selectedSecurityQuestionId: securityQuestion.id,
      securityAnswerHash,
    },
  });
};
