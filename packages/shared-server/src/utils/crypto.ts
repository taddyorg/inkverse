import crypto from "crypto";

export async function generateRandomString(length: number) {
  return await crypto.randomBytes(length/2) //Each byte is 8 bits. each hex is 4 bits.
    .toString('hex')
    .slice(0,length);
}

export function getHashSHA512(secret: string, salt: string) {
  const hash = crypto.createHmac('sha512', salt)
    .update(secret);
  const hashedSecret = hash.digest('hex');
  return [salt, hashedSecret];
};