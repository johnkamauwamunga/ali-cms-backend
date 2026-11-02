import argon2 from "argon2";

const hashingOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export const hashSecret = (secret: string): Promise<string> =>
  argon2.hash(secret, hashingOptions);

export const verifySecret = (
  hashedSecret: string,
  secret: string,
): Promise<boolean> => argon2.verify(hashedSecret, secret);

export const hashPassword = hashSecret;
export const verifyPassword = verifySecret;
