export interface User {
  id: bigint;
  name: string;
  email: string;
  hashed_password: string;
  createdAt: Date;
  updatedAt: Date;
}
