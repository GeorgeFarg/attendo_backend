export type User = {
  email: string;
  id: number;
  fullName: string;
  passwordHash: string;
  isValid: boolean;
  createdAt: Date;
};
