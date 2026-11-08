export interface ProjectType {
  id: string;
  name: string;
  repository: {
    fullName: string;
    defaultBranch: string;
  };
  description: string | null;
  environments: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
}
